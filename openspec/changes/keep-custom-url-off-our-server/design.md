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

- Changing where the custom endpoint lives. It stays in the page URL. See `proposal.md`, follow-up 2.
- Scrubbing query strings at the analytics / Sentry / logging sinks. See `proposal.md`, follow-up 1.
- Touching link generation, `pickClusterParams`, the cluster switcher, `isCustomUrlAllowed`, or the cross-cluster discovery probes.
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

### 4. Test the invariant at its definition, not per caller

One type-level test in `app/entities/cluster/lib/__tests__/cluster.spec.ts` asserts that `Cluster.Custom` is not assignable to `ServerCluster`. Individual callers get no duplicate type test: widening any caller's parameter back to `Cluster` would still fail to compile at its `serverClusterUrl` call, so per-caller tests would add maintenance without adding coverage.

The test asserts on the type, not on a call, so adding a `default:` branch to `serverClusterUrl` later cannot turn it into a false failure.

## Risks / Trade-offs

- **The URL leak stays open.** This closes the server-side resolution hole and one pointless fetch. A keyed `customUrl` still reaches our logs, GA, and Sentry via the query string. Nobody should read this change as protecting the endpoint — `proposal.md` records the verified sinks, and the spec's second requirement states the boundary so a later reader does not over-read it.
- **`ServerCluster` narrowing will surface at future call sites.** A new server helper threading a raw `Cluster` to an RPC call fails to compile until it narrows. That is the point, but it is friction. `serverClusterUrlFromParam` is the ready-made boundary for the untrusted-slug case.

## Migration Plan

No data migration, no URL-format change, no persisted-format change. Single deploy; rollback is a straight revert.

## Open Questions

- Sequencing of the two follow-ups. Sink scrubbing (1) is smaller, has no UX cost, and fixes the leak class for any future sensitive query param, so it likely goes first. The team decides.
