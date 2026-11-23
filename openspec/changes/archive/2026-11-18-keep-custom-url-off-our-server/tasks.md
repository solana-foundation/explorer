## 1. Server: make customUrl structurally unreadable

- [x] 1.1 In `app/entities/cluster/lib/cluster.ts`, add `type ServerCluster = Exclude<Cluster, Cluster.Custom>` and change `serverClusterUrl` to `serverClusterUrl(cluster: ServerCluster): string` — drop the `customUrl` parameter and the `Cluster.Custom` case.
- [x] 1.2 Re-export `type ServerCluster` from `app/utils/cluster.ts`.
- [x] 1.3 In `app/entities/cluster/lib/cluster-from-param.ts`, narrow away `Cluster.Custom` before calling `serverClusterUrl`. Keep `|| undefined` on the result so an empty `*_RPC_URL` env var still reads as invalid.
- [x] 1.4 Update the remaining `serverClusterUrl(cluster, '')` call sites: `app/api/token-image/[mintAddress]/route.ts` (after the existing Custom→400 guard), `app/features/receipt/api/get-tx.ts` (3 sites), `app/entities/domain/api/fetch-ans-domains.ts`, `app/entities/domain/api/resolve-domain.ts`, `app/api/verification/bluprynt/[mintAddress]/route.ts`.
- [x] 1.5 Type the cluster-carrying helpers as `ServerCluster`: `clusterFromGenesisHash` (`app/api/search/route.ts`), `findTransactionCluster` and `getSignatureStatus` (`app/features/receipt/api/get-tx.ts`), and `getTx`'s `cluster` / `findCluster` parameters.
- [x] 1.6 In `app/features/search/api/resolve-search-tokens.ts`, remove the `customUrl` parameter, take `ServerCluster`, and pass nothing to `serverClusterUrl`. Drop the `''` argument at both `app/api/search/route.ts` call sites.
- [x] 1.7 Remove `customUrl?: string` from the `searchParams` type in `app/utils/get-readable-title-from-address.ts`.

## 2. Client transport: stop sending customUrl to our own API

- [x] 2.1 In `app/entities/digital-asset/model/use-das-image.ts`, stop appending `customUrl` to the `/api/token-image` request and drop it from the SWR key and `fetchDasImage` signature.
- [x] 2.2 Keep the `Cluster.Custom → 400` guard in `app/api/token-image/[mintAddress]/route.ts` and its regression test as defense-in-depth.

## 3. Tests

- [x] 3.1 New `app/entities/cluster/lib/__tests__/cluster.spec.ts`: each non-custom cluster resolves to its own valid URL; the server env var wins over the public default; `Cluster.Custom` is not assignable to `ServerCluster` (`@ts-expect-error`, asserted on the type rather than on a call).
- [x] 3.2 Extend `cluster-from-param.spec.ts`: `serverClusterUrlFromParam` returns `undefined` when the cluster env var is set to `''`. Fix the stale comment claiming Custom resolves to an empty URL.
- [x] 3.3 In `use-das-image.spec.ts`, assert the SWR key carries no `customUrl` and the issued request has `cluster=custom` but no `customUrl` param.
- [x] 3.4 No per-caller type test for `resolveSearchTokens`. See design decision 5 — widening a caller's parameter would still fail to compile at its `serverClusterUrl` call, so the definition-site test covers it.

## 4. Review feedback (PR #1132)

- [x] 4.1 `app/utils/url.ts`: replace the two WHAT comments on the `customUrl` rule with WHY — a `customUrl` is only meaningful on the Custom cluster, and propagating it elsewhere leaks the user's (often API-keyed) endpoint for no functional gain. Explain why the `additionalParams` path decides from the *merged* cluster.
- [x] 4.2 `app/utils/__tests__/url.spec.ts`: cover the previously-untested side of the `additionalParams` guard — `customUrl` is *kept* when the merged cluster is `custom` (from current params, from additional params, and when switching to custom), and dropped when an override switches away from custom. Validated by mutation: removing the guard fails exactly these cases and passed silently before.
- [x] 4.3 Correct the documented URL-propagation policy. The non-goals wrongly listed `pickClusterParams` as untouched while this PR changes it. Added design decision 4 and a spec requirement so future work follows the actual policy; narrowed the non-goal to `buildExplorerLink` and the switcher, which really are untouched.
- [x] 4.4 Decide navigation propagation with `isCustomUrlAllowed` instead of a bare `cluster === custom` check. The bare check made the link builder stricter than the reader: with the dev flag on, or on a whitelisted host, `useClusterUrl` honors a `customUrl` on any cluster, so the first in-app click silently dropped an endpoint the page was using. `pickClusterParams` takes `devFlagEnabled` (default `false`, fails closed), supplied by the hook in 4.5. Absent cluster param maps to `DEFAULT_CLUSTER`, since `mainnet-beta` is omitted for being the default. Covered by six new cases in `url.spec.ts`.
- [x] 4.5 Add `useBuildClusterPath` in `app/utils/url.ts` and route the four callback-site callers through it, so the dev flag is read in one place instead of five. `useClusterPath` becomes a `useMemo` over the builder; `pickClusterParams` stays exported as the pure primitive. Both layouts no longer need `useSearchParams`. Four new hook tests cover the wiring — flag set, flag unset, live-params fallback, and hash placement — and the flag case was mutation-checked by hardcoding `false`.

## 5. Verify

- [x] 5.1 Run the full gate: `pnpm format:ci` → `pnpm lint` → `pnpm openspec:validate` → `pnpm typecheck` → `pnpm build` → `pnpm test:ci`.

## Descoped

The client-state half of the original proposal was cut: making the custom endpoint a `localStorage`-only value and removing it from generated links (`buildExplorerLink`), the cluster switcher, `isCustomUrlAllowed`, and the cross-cluster discovery probes. On the Custom cluster the endpoint stays in the page URL exactly as before.

`pickClusterParams` is **not** descoped — it ships in this change (see design decision 4). It stops propagating `customUrl` onto non-custom navigation targets, which is the one user-visible behavior change here.

That leaves the passive query-string leak open. See `proposal.md` ("Known residual") for the verified sinks and the two follow-up changes.
