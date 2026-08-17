## Context

The Custom cluster lets the browser talk to an arbitrary RPC endpoint directly: `shouldUseDirectRpc(Cluster.Custom)` is always true, and `wallet-provider.tsx` builds the connection from `clusterUrl(cluster, customUrl)` client-side. The Explorer's own server never needs the value — every server RPC call resolves from `*_RPC_URL` env vars, and every caller of `serverClusterUrl` already passes `''`.

Yet the signature still accepts a `customUrl` and returns it for `Cluster.Custom`, and one client fetch still forwards it to `/api/token-image`, which rejects it with a 400. The safety net is convention plus one runtime guard, not an enforced invariant.

See `proposal.md` for motivation and for the URL-query leak this change deliberately leaves open. This document covers the *how*.

## Goals / Non-Goals

**Goals:**

- Make it impossible for server code to resolve a client-supplied RPC URL — at the type level, not runtime-only.
- Stop the one client fetch that forwards `customUrl` to our own API for nothing.
- Remove the dead `customUrl` parameters and types that imply the server consumes the value.

**Non-Goals:**

- Changing where the custom endpoint lives *for the Custom cluster*. It stays in the page URL. See `proposal.md`, follow-up 2.
- Scrubbing query strings at the analytics / Sentry / logging sinks. See `proposal.md`, follow-up 1.
- Touching link generation (`buildExplorerLink`), the cluster switcher, or the cross-cluster discovery probes. All three keep emitting and honoring `customUrl` exactly as before.
- Changing `isCustomUrlAllowed`. Navigation now *calls* it (decision 4), but its rule is unchanged: Custom cluster, or the dev flag, or a whitelisted host.
- Making custom-cluster token images render. They do not today; that is a separate feature.

## Decisions

### 1. Enforce "the server never reads customUrl" at the type level

Change `serverClusterUrl(cluster: Cluster, customUrl: string)` → `serverClusterUrl(cluster: ServerCluster)`, where `type ServerCluster = Exclude<Cluster, Cluster.Custom>`. A caller holding a raw `Cluster` must narrow away `Cluster.Custom` first, and the compiler enforces it.

- **Why over a runtime check:** a runtime 400 must be re-added on every new route and is invisible to the type checker. `Exclude` makes the wrong call fail to compile once, everywhere.
- **Rejected:** keep the parameter and always pass `''`. That is the status quo — the door stays open and the signature keeps implying the server consumes a URL.

The narrowing propagates to the helpers that carry a cluster toward an outbound RPC call: `clusterFromGenesisHash` (`app/api/search/route.ts`) and `findTransactionCluster` / `getSignatureStatus` (`app/features/receipt/api/get-tx.ts`) now return and accept `ServerCluster`. That is the intended reach — these are exactly the places where a cluster becomes an RPC target.

`serverClusterUrlFromParam` remains the runtime boundary for an untrusted slug. It returns `undefined` for Custom, for an unknown cluster, and for a malformed param. It keeps its `|| undefined` on the resolved URL: a `*_RPC_URL` env var set to `""` survives the `??` fallback inside `serverClusterUrl`, and both route callers test only for `undefined`.

Also drop the dead `customUrl` from `resolveSearchTokens` (both call sites pass `''`) and the unused `customUrl?` from `getReadableTitleFromAddress`'s server-side `searchParams` type.

### 2. Stop forwarding customUrl on the token-image fetch

`useDasImage` drops `customUrl` from the request and from its SWR key. The cluster slug alone is a sufficient key, because the route rejects the Custom cluster — a Custom entry can never hold a per-endpoint image.

This was the only client fetch that forwarded the value. The page URL still carries it on navigation; that is out of scope here.

### 3. Keep the token-image route's 400 guard

The client no longer sends `customUrl`, but the route keeps rejecting `Cluster.Custom` and keeps its regression test. Cheap, and it still covers a hand-crafted request.

### 4. Propagate customUrl in navigation params only where the app would honor it

`pickClusterParams` carries `customUrl` forward only when `isCustomUrlAllowed` accepts it for the resulting cluster, and strips it otherwise. It applies the rule twice, because there are two paths into the merged params:

- the no-`additionalParams` path decides from the *current* cluster while picking which params survive;
- the `additionalParams` path decides from the **merged** cluster, after the override is applied. That ordering matters: `additionalParams` can switch the cluster away from custom, and deciding from the incoming cluster would carry the endpoint into a devnet URL.

Propagating a `customUrl` the app will not honor ships the user's endpoint (often API-keyed) into our server logs and into any shared link, for a cluster that ignores it.

**Why the shared criterion, not `cluster === custom`.** An earlier revision used the bare cluster check. That made the link builder stricter than the reader: `useClusterUrl` honors a `customUrl` on *any* cluster when the persisted dev flag is on or when the host is whitelisted. Under the bare check, both users kept a working endpoint on the page they landed on and lost it on the first in-app click — the URL the reader accepted, the builder deleted. One criterion in one place removes that class of drift: tighten or loosen `isCustomUrlAllowed` and navigation follows.

The cost is that the rule is no longer a pure function of the URL — `isCustomUrlAllowed` needs the dev flag, which lives in `localStorage` behind `customUrlEnabledAtom`. `pickClusterParams` therefore takes `devFlagEnabled` as a parameter rather than reading the atom itself: it stays pure and directly testable. The parameter defaults to `false` so a caller that forgets fails closed — it strips the endpoint rather than propagating one the app might not honor.

**Where the flag is read: `useBuildClusterPath`.** Threading the flag from every call site put six reads of `customUrlEnabledAtom` in the tree and made four components aware of a dev toggle they have no stake in. Those four call `pickClusterParams` inside a callback or a loop, which is why they could not use the existing `useClusterPath` hook — a hook cannot run per item.

`useBuildClusterPath` returns a builder function instead. It reads the atom and the live search params once, and hands back a stable callback. `useClusterPath` becomes a `useMemo` over it, and the four call sites drop their jotai imports entirely. Reads of the atom go back to two, both of which are about the flag itself: `useClusterUrl` resolves the endpoint, and `ClusterModalDeveloperSettings` is the toggle.

The builder takes an optional `currentSearchParams` override, defaulting to the live URL. One caller needs it: search navigation parses params out of the target item's own pathname rather than the URL bar. Both layouts stopped calling `useSearchParams` altogether, since the builder now owns that read.

A cluster param absent from the merged result means the *default* cluster, not an unknown one: `pickClusterParams` omits `cluster=mainnet-beta` precisely because it is the default. The helper maps `null` to `DEFAULT_CLUSTER` for that reason, and an unrecognized slug still strips.

This is the one place the change touches URL propagation. Link generation (`buildExplorerLink`) and the switcher are deliberately left alone, so a Custom-cluster URL still carries its endpoint — that is what follow-up 2 in `proposal.md` would change.

### 5. Test the invariant at its definition, not per caller

One type-level test in `app/entities/cluster/lib/__tests__/cluster.spec.ts` asserts that `Cluster.Custom` is not assignable to `ServerCluster`. Individual callers get no duplicate type test: widening any caller's parameter back to `Cluster` would still fail to compile at its `serverClusterUrl` call, so per-caller tests would add maintenance without adding coverage.

The test asserts on the type, not on a call, so adding a `default:` branch to `serverClusterUrl` later cannot turn it into a false failure.

## Risks / Trade-offs

- **The URL leak stays open.** This closes the server-side resolution hole and one pointless fetch. A keyed `customUrl` still reaches our logs, GA, and Sentry via the query string. Nobody should read this change as protecting the endpoint — `proposal.md` records the verified sinks, and the spec's second requirement states the boundary so a later reader does not over-read it.
- **`ServerCluster` narrowing will surface at future call sites.** A new server helper threading a raw `Cluster` to an RPC call fails to compile until it narrows. That is the point, but it is friction. `serverClusterUrlFromParam` is the ready-made boundary for the untrusted-slug case.

## Migration Plan

No data migration, no URL-format change, no persisted-format change. Single deploy; rollback is a straight revert.

## Open Questions

- Sequencing of the two follow-ups. Sink scrubbing (1) is smaller, has no UX cost, and fixes the leak class for any future sensitive query param, so it likely goes first. The team decides.
