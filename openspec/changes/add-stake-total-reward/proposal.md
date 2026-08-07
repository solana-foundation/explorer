# Proposal: Define the lifetime total reward for stake accounts

## Context

The Stake Delegation card (`DelegationCard` in `app/features/stake/ui/StakeAccountSection.tsx`) shows delegated, active, and inactive stake. It shows the vote address. It shows the activation and deactivation epochs. It does not show what the stake has earned.

Other explorers show a lifetime total. We do not.

We measured the number first. For `116vkzEjoTpFEd3x12XL9HbYJ5EpoC4cZ9a1N5A5mUt`, the rewards for epochs 943 to 1011 add up to **4,200,824 lamports**. Of those 69 epochs, 67 paid a reward. Epoch 979 paid nothing.

That figure is fixed for that epoch range, because past epoch rewards never change. The account keeps earning about 62,000 lamports per epoch, so its total today is higher. Read the number as evidence from one measurement, not as the account's current total.

## Why

Two simpler formulas look correct and are wrong. Each epoch adds the reward to `delegation.stake`. So the current account state cannot give you the total.

- `lamports − rentExemptReserve − delegation.stake` gives 10,586. That is the inactive stake, not the reward.
- `lamports − initial_deposit` gives 4,211,407. That is 10,583 lamports too high. The extra comes from Jito tip claims and dust.

Both errors are small. A reviewer will not catch either one. So we fix the definition before we write code.

### Why the range starts at creation, not at `activationEpoch`

`activationEpoch` looks like the account's first earning epoch. It is not. Re-delegating resets it to
the epoch of the latest delegation (`process_delegate` calls `new_stake(…, clock.epoch)`), and the
earlier delegation's rewards are still paid to the same address. A range that starts there drops
them. On `MCrWxQJgT3VogbgM5sy78K4uCEmwPQiKeXG2Bna51zs` that is 55,208,535 lamports earned against
10,482,997 reported — **81% missing**, under a label that reads "Total Reward". Five of 100 sampled
accounts sharing an activation epoch were already earning more than 100 epochs before it.

Three ways to fix it, and why this one:

- **Start at the cluster's first reward epoch (132).** Correct for every account, and it needs no
  extra call. It is ruled out by the sweep budget, not by cost — see below.
- **Rename the row to "Reward since epoch N".** Free, and honest, but gives up the figure we set out
  to show.
- **Start at the account's creation epoch.** An account cannot be paid before it exists, so this is a
  correct floor, and a tight one. `getSignaturesForAddress` finds it — stake accounts hold few
  signatures, because epoch rewards are credited by the runtime and never appear as transactions.
  It returns 55,208,535 for the account above, identical to the sweep from epoch 132.

**What decides it is the sweep budget, not the call count.** Measured at concurrency 2 against a
mainnet provider:

| Sweep | Calls | Wall clock | Retries |
| --- | --- | --- | --- |
| From creation, 169 epochs | 172 | 33 s | 37 |
| From the cluster floor, 881 epochs | 883 | 188 s | 221 |

`SWEEP_BUDGET_MS` is 40 s and `maxDuration` is 60. The 881-epoch sweep is 4.7× over budget, so it
answers 504 every time. Each attempt does leave its settled epochs cached, so it would warm across
roughly five timed-out requests, driven by whichever visitors happen to load the page — and until
then nobody sees a total. The cluster floor is not more expensive, it does not work. Its second cost
is cache footprint: 881 entries per account against 169, against a Data Cache shared team-wide.

**The honest cost is the warm path.** Once the per-epoch cache is full only the newest epoch is an
uncached call, so the sweep amortises to nearly nothing while the signature walk is paid on every
request: 4 network calls per request against the cluster floor's 3. We accept a permanent +1 to keep
the cold path inside the budget. On latency it is cheap — the walk needs only the address, so it runs
alongside the two calls already there, at 126 ms against `getAccountInfo`'s 112 ms.

The 33 s figure is worth watching. It leaves 7 s of headroom, so an account a few hundred epochs old
sits near the limit even with this floor.

**There is no fallback.** A page that comes back full means older signatures may sit behind it, so
the walk pages back until a page arrives short. If it still cannot date the account — more than five
pages, or no signatures at all — the request fails. Substituting `activationEpoch` there would answer
200 with a total short by an unknown amount, which is the same failure this change exists to fix, and
it would hit exactly the accounts with the longest histories. The card already renders `unavailable`
rather than a zero.

### Why we compute the total on the server

- **The cost is one RPC call per epoch.** That is 69 calls for the example account, and about 880 for one delegated near epoch 132. No RPC method returns the total.
- **On the client, every visitor pays that cost again.** On the server we pay it once and share the result.
- **The result is the same for everyone, and it changes once per epoch.** An epoch lasts about 2.1 days, so a cached result stays correct for a long time.
- **We already cache route responses.** Routes under `app/api/**` set `Cache-Control` headers. There is no new infrastructure to add.
- **The cost is paid once, not per visitor.** Fan-out stays low either way — `d5ee71e72` (#854) cut client fan-out to two calls at a time after 429s, and the sweep uses the same ceiling. Moving it server-side does not make it faster; it makes it happen once and be shared.

`GET /api/idl-latest` already has this shape. The route parses params, sets cache headers, and maps errors. The entity does the work.

The trade-off: the first request for an account still pays for the whole sweep.

### Why we cache each epoch, not the total

- **A settled epoch's reward never changes.** So each epoch response can be cached forever. There is no cache lifetime to choose and no staleness window.
- **After an epoch boundary only one epoch is a miss.** The rest are hits, so the sweep runs once per account and then grows by one call every 2.1 days.
- **The cache survives deploys.** We measured it: entries written with `next: { revalidate: false }` survived a rebuild with a new build ID. The fetch cache key does not include the build ID.
- **It is the mechanism we already use.** `app/entities/digital-asset/api.ts` caches its POST fetches the same way. No new concept and no config change.

We use `fetch` with `cache: 'force-cache'`. We do not use `use cache: remote`, which would require turning on `cacheComponents` for the whole app.

## What Changes

- **Define the total.** It is the sum of the per-epoch inflation staking rewards, over the account's own epoch range. Do not derive it from the current account state. Exclude MEV and transfers.
- **Bound the epoch range with the account.** Start at the epoch the account was created in. End at `deactivationEpoch`. Floor the start at the first epoch that paid inflation rewards (mainnet-beta 132, testnet 43). Inflation began in that epoch, so no earlier epoch can hold a reward. For the example account this gives 69 epochs, not 1012.

- **Compute the total on the server**, behind a cached route handler. The client makes one request.
- **Cache each epoch's RPC response on its own**, with `cache: 'force-cache'` and `next: { revalidate: false }`. One entry per account per epoch. The request body differs per epoch, and the body is part of the cache key, so each epoch gets its own entry.
- **Do not cache the newest epoch.** The last epoch in the range may not have settled yet, so it is fetched with `cache: 'no-store'`. Every earlier epoch is cached forever.

- **Show the total as a row in the Stake Delegation card, with three states.** Loading shows a placeholder in the row itself, not a spinner over the whole card. Success shows the SOL amount. Failure shows a short, quiet message in the same place. The other rows keep working either way.
- **Run the sweep with `fetchAll` at concurrency 2**, matching the client paths. 8 was measured to rate-limit a cold sweep partway through. After warm-up only the newest epoch is an uncached call, so the ceiling costs nothing in the steady state.

- **Cache the route response at the CDN for 4 hours**, using the shared `CACHE_HEADERS` in `app/shared/lib/http-utils.ts` (`max-age` and `s-maxage` of 14400, `stale-while-revalidate` of 3600). This sits on top of the per-epoch cache: without it, every request re-runs the sweep as cache reads even when no epoch has changed. Only successful responses carry it.

- **Fail the whole request when part of the sweep fails.** An RPC error that survives `withBackoff` returns an uncached 502, following `app/api/idl-latest/route.ts`. A null result is not a failure — it means no reward was paid and counts as zero. We never return a partial total, because it is wrong by an unknown amount and still looks authoritative. Every epoch that did succeed stays in the per-epoch cache, so a retry re-fetches only what failed.

## Impact

- **Files:** a `stake-rewards` entity (creation epoch, epoch range, sweep), the stake feature's delegation parser, hook and card row, and `GET /api/stake-rewards/[address]`.
- **What the number leaves out.** It counts inflation staking rewards only. It excludes MEV paid into the stake account. A fully deactivated account stops earning, so the range ends at `deactivationEpoch`. That last bound is a small known gap: cooldown can span several epochs when a lot of stake deactivates at once, and a partially effective stake still earns during them.
- **One extra RPC call per request**, for the signature walk that dates the account — more if the account has over 1000 signatures. It runs in parallel with the two calls already there, so it adds about 14 ms rather than a round trip. Sampled on mainnet-beta: 25 accounts delegated in epoch 1005 held a median of 8 signatures and at most 139; 25 delegated in epoch 300 held a median of 270 and at most 615. None needed a second page.
- **Accounts we will refuse to answer for.** An account with more than 5000 signatures returns 502 and the card shows `unavailable`. None were found in sampling, and the alternative is a total that is short by an unknown amount.
- **A long-idle account now costs more.** One created long ago but delegated only recently sweeps from creation and finds zeros for most of that span. It cannot be told apart from a re-delegated account without sweeping, so it pays. If it exceeds the budget the card shows `unavailable` rather than a short total.
- **Open cost problem.** No RPC method returns the total. It costs one call per epoch on a cold cache.
- **Cache size to watch.** One entry per account per epoch, about 133 bytes each. The cache evicts least-recently-used entries, so "forever" is best effort. An evicted epoch costs one re-fetch, not a wrong answer. On Pro the Data Cache is shared by every project in the team, so heavy writing evicts other projects' entries. Check Observability → Runtime Cache after release. If we are evicting other projects, move the aggregation to the CDN cache on our own route: one entry per account instead of one per epoch.
- **Cost of not caching the newest epoch:** one uncached RPC call per sweep. That is the price of never storing an unsettled epoch forever, and it is cheap next to the alternative — a permanently short total that survives deploys and needs a team-wide cache purge to clear.
