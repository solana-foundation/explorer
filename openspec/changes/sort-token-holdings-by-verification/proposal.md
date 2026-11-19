# Proposal: Order token holdings by verification status

## Context

Address pages list every SPL and Token-2022 holding an account owns. Since #1181 lifted the 100-token cap, `TokensProvider` (`app/providers/accounts/tokens.tsx:66-82`) fetches every token account and `OwnedTokensCard` renders them in RPC return order, which is arbitrary. Measured against the accounts named in the issue:

| Address  | Token accounts |
| -------- | -------------- |
| `86xCn…` | 1051           |
| `MJKqp…` | 520            |
| `8BseX…` | 183            |

For `86xCn…` the 1051 accounts map to 1051 distinct mints, and most of them are airdropped tokens. A user's real holdings sit scattered among them, so the first screen of 20 rows is effectively random.

Metadata reaches the card lazily, one visible row at a time: `TokenRow` calls `useTokenInfo`, which batches the rows on screen into one POST to `/api/token-info`. The `verified` flag therefore does not exist for a token until its row has already rendered, so the list cannot be ordered by it.

## Why

The objection raised on the issue is that every holding is equally valid on-chain, so nothing distinguishes relevant from irrelevant. That is correct, and it rules out the cheap filters. Each was measured rather than assumed:

- **Zero balances.** 5 accounts of 1051. Junk tokens carry nonzero balances, so an amount filter removes nothing.
- **Metadata existence.** Jupiter's token API resolves a name and symbol for 74 of 100 sampled mints, none of them verified. Junk tokens have metadata, so its presence does not discriminate.
- **Balance ordering.** Meaningless across differing decimals. Ordering by value needs prices for ~1000 mints, and `/api/token-price` resolves one mint per request.

What remains is the curated off-chain registry the Explorer already reads, Jupiter. Its `verified` field is populated and discriminating: it marks 46 of the 1117 distinct mints that a later count found in `86xCn…`. Ordering rather than filtering keeps every holding reachable, so the Explorer reports a fact from a named source instead of deciding which of a user's tokens deserve to exist.

Jupiter lists 847 of those 1117 mints, so a tier for mints Jupiter lists but does not verify would hold mostly airdropped tokens. The order has two tiers: verified, then the rest.

Alternatives considered:

- **Hide unverified tokens behind a filter.** Rejected for now. It hides real holdings by default, and it costs a control, a URL parameter and an empty state. The tiered order meets the goal — surface the relevant tokens first — without removing anything, and a filter can be layered on later.
- **Resolve and sort holdings server-side, returning one page.** Rejected as a separate concern. It would cut the client download from ~102 KB to ~5 KB, but it targets the RPC payload, not the sort. `serverClusterUrl` excludes `Cluster.Custom` by construction (see `keep-custom-url-off-our-server`), so a client path must survive for local validators — a permanent second implementation. `TokenHistoryCard` shares the same provider, Load More becomes a round trip, and refresh moves to route invalidation. That is its own change.
- **Send the browser the addresses of every verified token, from a route the CDN caches.** Rejected on transfer. The list holds 3772 addresses, 123 KB gzipped, per browser per `CACHE_MAX_AGE`, and every page of rows still sends a token info request.
- **Send the account's mints in a GET, so the CDN caches the answer.** Rejected. The 14 KB URL limit of the CDN fits 319 mints, so `86xCn…` needs 4 requests, and a URL that names one account's mints repeats only for that account.
- **Resolve metadata for every holding up front, and order by its `verified` flag.** Rejected on measurement. Jupiter answers at most 100 mints per request, so `86xCn…` costs 12 requests on its first view within the cache window. The `JUPITER_API_KEY` used to measure allows 10 requests in any 10 seconds, and a burst of the 12 requests got 3 answers of 429. One failed request leaves every holding in RPC order. Search, the verification badge and the page title spend the same key.
- **Sort progressively as the lazy batches arrive.** Rejected. A verified token at position 900 stays invisible until it is fetched, so rows would reshuffle under the cursor while the user scrolls.
- **Keep RPC order.** Rejected: it is the status quo the issue reports.

The added cost is one request per view. The browser sends the account's mints, 58 KB for the 1117 mints of `86xCn…`, and receives the token info of the verified ones, 4.6 KB gzipped for 46 mints. The server keeps Jupiter's verified list in the Next data cache, so Jupiter gets one request per cache refresh, not one per view.

## What Changes

- Send the account's mints to `POST /api/token-info/verified`. The route answers the token info of the mints in Jupiter's `verified` tag list (`GET /tokens/v2/tag?query=verified`), which Jupiter documents as the entire array of mints with the tag. The server keeps the list as token info in the Next data cache through `unstable_cache`, 806 KB, under the 2 MB item limit. The raw Jupiter answer is 5.0 MB, so the Jupiter request itself is not cached.
- Order the deduplicated mints into two tiers: verified, then the rest. RPC order is preserved within each tier, so the order is stable and reproducible.
- A verified row takes its token info from that answer. An unverified row looks up its own token info through `useTokenInfo`, and the browser batches the lookups of one render into one request. The first two pages of `86xCn…` hold only verified mints, so they send no further request.
- The tag list and the search `isVerified` flag, which the badge reads, agree. On the 1117 mints of `86xCn…` both mark the same 46 mints, and on 220 trending and recent tokens both mark the same 130. For those 46 mints, the tag list carries the same name, symbol, logo and decimals as search.
- Clusters that Jupiter does not cover load no verified mints, so the order matches RPC order.

## Impact

- **Files:** `app/components/account/OwnedTokensCard.tsx`, `app/api/token-info/verified/route.ts`, plus `lookupVerifiedTokenInfos`, `useVerifiedTokenInfos` and a pure ordering function under `app/entities/token-info/`.
- **Behaviour:** the first 20 rows change for any address holding verified tokens. `app/components/account/__tests__/OwnedTokensCard.spec.tsx` asserts on row order and needs updating.
- **Transfer:** each view of an account's holdings uploads its mint list, about 45 bytes per mint, and downloads the token info of its verified mints, on top of the token accounts the page already fetches. A page of rows with an unverified mint costs one more request.
- **Latency:** the card's first paint waits on the verified lookup. Unverified names, symbols and logos fill in after the rows render, and do not move a row. Reordering after paint was rejected as visually worse.
- **Accepted risk:** verification rests on one upstream list. If Jupiter fails, the tiers collapse and the order falls back to RPC order. The card still renders every holding.
- **Unchanged:** the RPC fetch in `TokensProvider`, the Summary/Detailed toggle, Load More paging, and `TokenHistoryCard`.
