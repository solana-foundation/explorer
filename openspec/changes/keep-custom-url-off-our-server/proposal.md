# Proposal: Keep the custom-cluster RPC URL off the Explorer's server

## Context

The Explorer lets a user point at an arbitrary Solana RPC endpoint by selecting the **Custom** cluster and entering a URL (`customUrl`). The browser talks to that endpoint **directly** — `shouldUseDirectRpc(Cluster.Custom)` is always true. Our Next.js server never needs the value; it has its own endpoints via `*_RPC_URL` env vars.

Nothing structurally stops server code from resolving that client-supplied URL:

- `serverClusterUrl(cluster, customUrl)` accepts a `customUrl` and returns it for `Cluster.Custom` (`app/entities/cluster/lib/cluster.ts:89`). Every caller already passes `''`, so the parameter is dead weight that keeps the door open.
- `resolveSearchTokens` threads a `customUrl` through to that resolver; both call sites pass `''`.
- `getReadableTitleFromAddress` declares `customUrl?: string` in its server-side `searchParams` type (`app/utils/get-readable-title-from-address.ts:11`) but never reads it.
- `useDasImage` appends `customUrl` to a `/api/token-image` request (`app/entities/digital-asset/model/use-das-image.ts:15`). The route reads only `cluster` and rejects Custom with HTTP 400, so the value is transmitted and discarded. This fires on **every cluster, for every user**, not just on Custom: `rememberedCustomUrlAtom` defaults to `DEFAULT_CUSTOM_URL` (`http://localhost:8899`) and `useCluster().customUrl` returns that remembered value regardless of the active cluster, so the `if (customUrl)` guard is always true. A user who has saved a keyed endpoint ships it to us on every token-image load while browsing mainnet.

## Why

One invariant should hold by construction, not by convention: **the server never reads `customUrl`**. Today it holds only because everyone remembers to pass `''`, plus one runtime 400 on one route. That guard is per-route and easy to forget on the next route that resolves a cluster. Worse, the dead parameters and the server-side `customUrl?` type mislead the next reader into thinking the server consumes the value.

Excluding `Cluster.Custom` from the resolver's type turns an SSRF-shaped foot-gun into a compile error — once, everywhere.

Alternatives considered:

- **Keep the runtime 400 as the only server defense.** Rejected: per-route, easy to forget, invisible to the type checker.
- **Sanitize `customUrl` server-side.** Rejected: the server has no use for the value, so accepting-then-filtering is strictly worse than never accepting it.
- **Keep the parameter and keep passing `''`.** Rejected: that is the status quo.

## What Changes

- **Server (structural):** `serverClusterUrl` loses its `customUrl` parameter and takes `ServerCluster = Exclude<Cluster, Cluster.Custom>`. `resolveSearchTokens` loses its dead `customUrl`. `getReadableTitleFromAddress` loses the unused `customUrl?`.
- **Client transport:** `useDasImage` stops attaching `customUrl` to `/api/token-image`. Rule established: no client-issued fetch to an Explorer `/api/*` route carries `customUrl`. Custom-cluster token images continue not to render.
- **Navigation params:** `pickClusterParams` propagates `customUrl` only when `isCustomUrlAllowed` accepts it for the resulting cluster, and strips it otherwise — so browsing a non-custom cluster stops carrying the endpoint from link to link, unless the dev flag or the host whitelist says the app honors it there. The `additionalParams` path decides from the *merged* cluster, so switching custom → devnet drops the endpoint rather than inheriting it.
- **Kept as defense-in-depth:** the token-image route's `Cluster.Custom → 400` guard and its regression test.
- **Unchanged:** on the Custom cluster the page URL still carries `?cluster=custom&customUrl=…` as the source of truth. Link generation (`buildExplorerLink`), the cluster switcher, and the cross-cluster discovery probes are untouched. `isCustomUrlAllowed` keeps its rule — navigation now defers to it instead of re-deciding.

## Known residual: the page URL still carries `customUrl`

This change does not address the passive leak. That is a scope decision, not an oversight.

Because the endpoint stays in the query string, every hard navigation, SSR render, RSC request, and `generateMetadata` call carries it to our server. Custom RPC URLs commonly embed an API key, so the user's own third-party credential travels with them. Sinks verified in this repo:

- **Google Analytics / GTM** — `app/@analytics/default.js:64` calls `gtag('config', id)` with defaults; `:35` loads GTM. GA4's `page_view` sends `page_location` = `document.location.href`, full query string. No `page_location` override and no query stripping, so a keyed endpoint reaches Google on every custom-cluster pageview (post-consent).
- **Sentry** — `sentry/config.mjs` sets `sampleRate: 1` with no `beforeSend`. The browser SDK attaches `request.url` from `location.href`.
- **Vercel access logs and log drains.**
- **Shared links and link unfurlers** — an unfurler fetches the pasted URL server-side.
- **Browser history and cloud sync.**

Scope: this leaks the *user's* RPC credential, not an Explorer credential. Nobody escalates privileges in the Explorer through it. It is a privacy defect, not an Explorer-compromising vulnerability.

Two follow-ups, each worth its own change:

1. **Scrub at the sinks** — a `beforeSend` URL scrub in `sentry/config.mjs` and a `page_location` override in the GA config. Fixes the whole class: any future sensitive query param, not just `customUrl`.
2. **Make the endpoint a client-only `localStorage` value** — removes the data instead of filtering it. Costs shareable custom-cluster links, so it needs its own decision.

## Capabilities

### New Capabilities

- `custom-cluster-url`: how the custom-cluster RPC endpoint may be propagated, and why the Explorer's own server must never resolve it.

### Modified Capabilities

- (none — no existing spec files under `openspec/specs/`)

## Impact

- **Server:** `app/entities/cluster/lib/cluster.ts`, `cluster-from-param.ts`, `app/features/search/api/resolve-search-tokens.ts`, `app/api/search/route.ts`, `app/utils/get-readable-title-from-address.ts`, `app/utils/cluster.ts` (re-export), and the `serverClusterUrl` call sites in `app/api/token-image/[mintAddress]/route.ts`, `app/api/verification/bluprynt/[mintAddress]/route.ts`, `app/features/receipt/api/get-tx.ts`, `app/entities/domain/api/fetch-ans-domains.ts`, `resolve-domain.ts`.
- **Client:** `app/entities/digital-asset/model/use-das-image.ts`, `app/utils/url.ts` (new `useBuildClusterPath`), and the callers that moved onto it: `app/features/search/model/use-search-navigation.ts`, `app/components/block/BlockHistoryCard.tsx`, `app/address/[address]/layout.tsx`, `app/block/[slot]/layout.tsx`.
- **Behavior:** one visible change — navigation stops carrying `customUrl` onto a cluster where the app would not honor it. A user on the Custom cluster, a developer with the persisted flag on, and the whitelisted-host flow all keep their endpoint across links, exactly as before. Custom-cluster token images are unchanged (still not rendered). Server changes are type-only.
- **Compatibility:** no URL-format and no persisted-format change. Rollback is a straight revert.
- **Tests:** `serverClusterUrl` (env precedence + the `ServerCluster` type exclusion), `serverClusterUrlFromParam`'s empty-env-var guard, `useDasImage` sending no `customUrl`, and `pickClusterParams` on both sides of the allow rule — kept for Custom, the dev flag, and a whitelisted host; stripped otherwise. The token-image `customUrl` SSRF regression test stays.
