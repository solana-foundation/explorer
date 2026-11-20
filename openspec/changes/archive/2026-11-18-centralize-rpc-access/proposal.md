# Proposal: Centralize RPC access behind the cluster entity

## Context

The Explorer is mid-migration from `@solana/web3.js` v1 to `@solana/kit` 7. Kit already powers transaction decoding, the validators layer, stake/vote/subscriptions, and every `@solana-program/*` client — but each kit call site constructs its own client: ~78 scattered `createSolanaRpc(url)` calls across 36 files, with no shared handle. Every new fetcher re-derives "get me an rpc for the active cluster" from `useCluster().url`, and nothing guarantees two components on the same page share a client.

This change is the first step of the full web3.js removal roadmap, which proceeds in phases: foundations and dependency quick wins (spl-token, buffer-layout, borsh → kit codecs); replacing every remaining `new Connection(...)` in the providers layer with kit rpc; unifying instruction parsing per the `unify-instruction-parsing` change; moving the transaction detail page and the inspector onto kit introspection types; replacing the metaplex/domains/anchor/wallet-adapter dependency corners with kit-native or codama-generated clients; and finally sweeping `PublicKey` for `Address` and deleting the compat shims (`app/utils/kit-wrapper.tsx`, `app/shared/lib/web3js-compat.ts`, `packages/parsers/src/compat/*`). Done means `@solana/web3.js` is out of the dependency tree. Until that endgame, `@/app/shared/lib/web3js-compat` remains the single permitted web3.js bridge.

The provider migrations in that roadmap all need the same primitive first: one blessed way to obtain a kit rpc client for a cluster URL.

### Alternatives considered

- **Keep constructing clients ad-hoc.** Rejected: every `Connection`-removal PR would invent its own client handling, and effect hooks cannot safely depend on a client whose identity changes every render.
- **A React-context RpcProvider holding the client.** Rejected as needless indirection: the cluster state (and thus the URL) already lives in `ClusterProvider`, and non-React code (route handlers, module-level fetchers) needs a client too. A context would force a second, parallel path for those.
- **Placement in `app/shared/lib`.** Rejected: the accessor is not generic shared code — it is the cluster entity's concern (an rpc client *for a cluster*), and FSD places it there. Consumers reach it via `@entities/cluster` or the existing `@providers/cluster` façade.

## What Changes

- Add `getRpc(url)` in `app/entities/cluster/api/get-rpc.ts`: returns a `createSolanaRpc` client memoized per URL, so repeated calls share one client and the identity is referentially stable. Exports the `SolanaRpc` type for consumers.
- Add `useSolanaRpc()` in `app/entities/cluster/model/use-solana-rpc.ts`: the hook form, resolving the active cluster URL via `useCluster()` and delegating to `getRpc`.
- Export both from the entity's public API and the `@providers/cluster` re-export façade.
- Adopt the accessor in three existing kit call sites to establish the pattern: `app/providers/supply.tsx`, `app/providers/stats/solanaClusterStats.tsx` (hook form), `app/features/vote/model/vote-accounts.tsx`.

**Out of scope:** migrating the remaining `createSolanaRpc` call sites and the web3.js `Connection` sites — those move onto the accessor in the follow-up provider-migration changes described above.

## Impact

- **No behaviour change.** The adopted call sites issue the same RPC calls against the same URLs; the only difference is client reuse instead of per-call construction.
- **Every subsequent `Connection`-removal change** consumes this accessor instead of inventing client handling, and effect hooks can list the rpc client in dependency arrays without re-firing on every render.
- **Tests:** colocated spec covering the per-URL memoization contract.
