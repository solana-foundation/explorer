# Proposal: Show a stake account's lifetime total reward, sourced from Solscan

## Context

The Stake Delegation card (`DelegationCard` in `app/features/stake/ui/StakeAccountSection.tsx`) shows delegated, active and inactive stake, the vote address, and the activation and deactivation epochs. It does not show what the stake has earned. Other explorers do.

The figure cannot be derived from account state: each epoch's reward is added to **both** the lamport balance and `delegation.stake`, and the principal at delegation time is never stored. Two plausible formulas are wrong — `lamports − rentExemptReserve − delegation.stake` yields the inactive stake, and `lamports − initial_deposit` overshoots by MEV tip claims and dust. No RPC method returns the total either; `getInflationReward` serves one epoch per call.

## Why

Solscan indexes the per-epoch rewards. Three of its endpoints could supply them:

- **`account/stake/reward` — chosen.** The only endpoint whose `address` parameter is documented as "a stake account on Solana". Costs `ceil(epochs / 100)` requests, **bounded by cluster age**: at most 10, growing by one page per ~7 months. A 70-epoch account costs one.
- **`account/stake`, with its precomputed `total_reward` — rejected.** Exactly the number we want, but `address` is a wallet, so reaching our row means paging an authority's listing 40 at a time with no way to sort or filter to an address. Measured on mainnet: the Jito pool authority owns **693** stake accounts and Solblaze **703** — 18 pages each, unbounded as pools grow. Worth revisiting as a fast path for old accounts under small authorities, once a live response can be measured.
- **`account/reward/export` — rejected.** Wallet-keyed, and capped at 10 requests per minute.

The paging runs server-side because the key must not reach the browser and every visitor gets the same answer, so the work is done once and shared through the CDN. `GET /api/token-market-data/[address]` already has this shape.

The route is public, so one cheap `getAccountInfo` gates it: without that, enumerating arbitrary addresses would spend metered quota, and paging makes each request worth up to ten upstream calls. Legitimate traffic only ever asks about stake accounts, so the check costs users nothing.

## What Changes

- A `stake-rewards` entity that pages `GET /v2.0/account/stake/reward` and sums `amount`, behind `GET /api/stake-rewards/[address]` — mainnet-only, response cached 4 h at the CDN.
- A `Total Reward (SOL)` row on the Stake Delegation card. `DelegationCard` becomes presentational and takes the state as a prop; the section owns the fetch.
- A `NEXT_PUBLIC_STAKE_TOTAL_REWARD_ENABLED` flag, off by default, gating both the row and the route. It is client-readable on purpose: the browser otherwise cannot tell an unprovisioned deployment from a broken one, so it requests a total it will never get and renders `Unavailable` on every stake page. The flag is feature-scoped rather than Solscan-wide because there is one consumer.
- `SOLSCAN_API_KEY` in `.env.example`.

Behaviour — the range floor, the paging bound, the guards, and the row's states — is specified in [`specs/stake-reward-total/spec.md`](specs/stake-reward-total/spec.md).

## Impact

- **A new paid vendor dependency.** The feature requires a Solscan Pro plan; the free tier reaches none of the v2.0 endpoints.
- **Degrades, never breaks.** No key, a failed request, or a non-mainnet cluster all render the same quiet `Unavailable`, never a `0` — a zero is a claim about the account, not about the request. The rest of the card is unaffected.
- **The figure is not everything the account earned.** It counts protocol inflation rewards only. MEV tips reach a delegator's stake account as a claim transfer rather than an epoch reward, so they are absent from this endpoint and the row reads lower than the account's actual growth. Measured on `116vkz…`: 10,583 lamports of Jito tip claims and dust above the inflation sum.
- **The first visitor after a cache miss waits for every page.** Up to 10 sequential upstream calls before the row resolves; the 4 h cache only helps everyone after them.
- **Quota exhaustion is bounded, not prevented — accepted deliberately.** The route is public with no application-level rate limiting, matching the other paid-key routes (`token-market-data`, `verification/rugcheck`, `verification/jupiter`). The stake-account gate turns an enumeration of arbitrary addresses into one cheap RPC call, but stake account addresses are themselves public, and a cache miss on a real one still costs up to ten upstream calls — more than those routes, which spend one. Rate limiting is the next step if quota burn shows up in practice.
