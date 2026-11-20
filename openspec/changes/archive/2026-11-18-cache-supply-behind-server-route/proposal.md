# Proposal: Read chain supply through a cached server route

## Context

The home page blocked ~8 s on `getSupply` — a full-ledger scan, run uncached from the browser on every load, and only after the genesis-hash check finished.

## Why

The figure is identical for every visitor, so the sharing belongs upstream of the browser. Client caching only helps someone who already waited once. `/api/supply` caches it at the CDN, like `/api/ping` and `/api/stake-rewards`.

Freshness is not the constraint: the card rounds to a step inflation crosses about once a day. So the TTL is set to spare the node instead. Every CDN region revalidates independently, so a short `s-maxage` multiplies the scan across all of them. The wide `stale-while-revalidate` window is what keeps visitors off the node on quiet regions and clusters.

`SupplyProvider` became an SWR hook rather than being edited in place: its only consumer was `app/page.tsx`, and three of its five states existed to describe waiting on the cluster connection — the coupling this removes. Matches `useTotalReward` / `useSecurityTxt`.

Custom and localhost keep asking RPC directly, for two different reasons. `resolveServerClusterUrl` refuses `Cluster.Custom` on purpose, because its URL is client-supplied and the server must never be aimed at it. Localhost it cannot refuse, having no way to know: `shouldUseDirectRpc` keeps a known cluster pointed at a local validator on the browser path, since the route could not reach that node either.

The route answers one query shape and nothing else. The CDN keys on the whole URL, so any other spelling of the same request is a fresh miss, and each miss is a ledger scan an unauthenticated caller can ask for. Refusing everything but `?cluster=<digits>` keeps the expensive path reachable only at the URL every visitor shares.

Three policies follow the same rule — the party that can see a cost or a failure is the one that acts on it:

- **Revalidation.** Free through the route, since a request inside the CDN window never reaches the node. On the direct path it is another full-ledger scan at the visitor's own endpoint, so it is off there.
- **Reporting.** Each side reports what the other cannot see. The route records every failure it answers. The browser reports a `4xx` — which the route deliberately does not, since any caller can provoke one, while this client sends a single fixed request — and a `200` whose body it cannot read. It stays quiet on `5xx`, and on a rate limit: that one comes from in front of the route rather than from it, and one throttled region would otherwise report once per visitor.
- **Paging.** Nothing here pages. A node refusing the call needs a configuration change, not an alert. A name that stops resolving, a certificate nothing accepts and a proxy answering with HTML are all upstream too, and waking someone fixes none of them.

Errors are cached in the visitor's own browser, which is the only cache that will hold them: a shared cache stores a handful of status codes and no error status is among them, so `s-maxage` does nothing for a `5xx`. The bound that remains is per-visitor. It absorbs the retries that follow one answer — without it each of them is another ledger scan — but it does not bound anything across visitors, so a slow node is recorded once per visitor rather than once. The reporting tiers below are set on that understanding.

Both failure tiers used to answer `502`, so the client could not act on a classification the route had already made. Transient failures now answer `503` and refusals `502`, and the client retries the first and leaves the second alone. It reads a rate limit the same way as a `503`, since only the route's own answers say anything about whether asking again could help.

The consent rule moved into the cluster entity as `connectableUrl`. Its two halves — a custom URL held for consent, and one the browser has not judged yet — were separate values a consumer had to combine, and neither implies the other: while the second holds, `pendingCustomUrl` is deliberately undefined. `ClusterProvider` combined them correctly; a second fetching hook keying on `url` would not have, and `customUrlDecided` was not even on the context to check.

`ConnectableUrl` is a branded string, so that mistake now fails to compile: the `url` beside it on the context always resolves, and resolves to the fallback endpoint while consent is pending, and a plain string is not assignable to the fetchers' parameter.

The brand does not reach every path yet. `useSolanaRpc()` still builds a client straight from `url`, and this change moves its last three call sites off it — two by deleting them, one onto `getRpc(connectableUrl)` — so the accessor `centralize-rpc-access` introduced now has no consumers until the next provider migration adopts it. It stays, because the twenty-odd files still calling `createSolanaRpc` are its queue. Retyping it to return `SolanaRpc | undefined` from `connectableUrl` is what closes the gap, and it is a decision for the change that has a caller to shape it: every consumer inherits an undefined branch, and designing that against no caller is a guess.

## What Changes

- `app/api/supply/route.ts` — known clusters only, one canonical query shape, CDN cache, a deadline with a `maxDuration` above it, and an error policy that sorts failures by who has to act.
- `app/features/supply/` — wire contract, fetchers, `useSupply()`. Counts travel as decimal strings, because `JSON.stringify` throws on a bigint and a `number` rounds above 2^53. `Supply` carries kit's branded `Lamports`, which adds the u64 bound a digit check cannot see, and `toSupply` is the only constructor, so the route path and the direct path are held to the same figures — including `circulating <= total`, which neither field can see on its own. It checks that the counts are integers first: kit's `lamports` compares rather than parses, so an absent field or a string clears its bound untouched, and the direct path has nothing else between a node's answer and the card. `nonCirculating` is dropped: nothing read it.
- Supply starts on mount, not on `ClusterStatus.Connected`.
- Every browser fetch carries a deadline, the genesis-hash check included. Without one, a connection accepted and never answered leaves the card loading for good: no error, no retry, nothing recorded. The health check is the one that had none, and the cluster status waits on it — so did the staking card, which keys on that status.
- A failure no retry can change is its own state rather than a `failed` with the callback left off, so the card chooses its message from the state and not from a missing field. Nothing offers a dead retry either way.
- `useVoteAccounts` became an SWR hook too, keyed by cluster and endpoint. Supply used to be the slow half, and its wait hid that vote accounts were held in unkeyed `useState` — a cluster switch left the previous cluster's figures on screen. It reports at warning level rather than error level: it fires from the browser, once per visitor, with no CDN in front of it, so one slow cluster would otherwise set the Sentry error rate on its own. Classifying the failure instead would be better, and costs 60 kB of `@solana/idl` in that bundle to do — measured, not guessed.
- `isRpcMisconfigError` matches the codes it means rather than every `SolanaError` left over. A request body the node could not parse, and a figure the client cannot represent, are ours — not somebody else's configuration.
- The connection-level retryable set gains the codes undici reports for a DNS blip, an unreachable host, a reset socket and an aborted connection, which were reaching the unclassified branch. A name that stops resolving and a TLS handshake nothing completes stay out of it: both need someone to act. This set also decides the paging tier on `/api/idl-latest` and `/api/security-txt`, which share the classifier — those four codes move there from `panic` to `warn`, which is the point: a DNS blip should not wake anyone.
- The unclassified tier answers `503`, not `502`. Nothing there can say the next attempt fails the same way, so `502` is left meaning one thing — a node refusing the call — which is the only answer the client is told not to re-ask. It still reports at error level: a failure nothing recognises is one to look at.
- Both home-page cards moved into `app/components/StakingSection.tsx`, where their waiting and failure states are covered.
- `ClusterState` gains `connectableUrl`, typed `ConnectableUrl` and required rather than optional: absent and "not settled yet" are the same value to every consumer, so a provider omitting the field would leave all of them waiting and say nothing. `useClusterUrl` no longer returns `customUrlDecided`.
- `clusterUrl` reads its `NEXT_PUBLIC_*_RPC_URL` with `||` rather than `??`. A var set to `""` used to resolve to an empty string, which every consumer now keys on and reads as "no endpoint decided yet" — so a blank setting would leave the cards loading for good. The server-side reader keeps treating `""` as `unconfigured`, because it can report that and a browser cannot.
- Removed: `app/providers/supply.tsx`, its `idle` / `disconnected` states, and the unused `MockSupplyProvider` / `withSupply`.

## Impact

- Circulating Supply renders after one cached round trip. Active Stake still waits on `getVoteAccounts` — out of scope here.
- Cluster switches show skeletons instead of hiding the cards, and never show one cluster's stake against another's supply.
- Zero delinquent stake now reads `Delinquent stake: 0.0%` rather than hiding the row, which had made a healthy cluster and an unknown one look alike.
- The stake card is drawn against total supply, so it cannot render before supply does. The wait is one-way: once supply is in hand, its card stays up while stake is still coming.
- A failing route costs the node one scan per visitor per browser-cache window, rather than one per retry. The shared cache holds the successful answer but not the failed one, so a failure still scales with visitors.
