# Proposal: Project the SIMD-0553 fee alongside the fee a transaction paid

## Context

SIMD-0553 ("Resource and Inclusion Fee") would replace today's flat 5,000-lamport-per-signature base fee with two parts: a 2,500-lamport inclusion fee paid entirely to the leader, and a resource fee burned in full that scales with the cost units a transaction *requested*. Priority fees are untouched (SIMD-0096). The rate ramps through three feature gates — 1/10, then 1/4, then 1/2 lamport per requested cost unit — so applications can tighten their Compute Budget requests before the terminal rate lands. SGP-0003 asks validators to endorse the direction; the mechanism is SIMD-0553's.

The proposal's own impact section says the cost lands unevenly: lean transactions get cheaper than today's flat fee, while transactions that over-request compute get much more expensive. Nothing in the explorer lets someone see which side of that line a given transaction falls on. The summary card already renders the two inputs the model needs side by side — the fee paid and the transaction's cost units — so the arithmetic is there but unstated.

## Why

The fee row now shows the projected total at each staged rate, next to what the transaction actually paid.

**Projected, not gated.** None of the three feature gates are in `feature-gates.json` yet — the SGP is a draft — so there is no activation status to read and no way to key the row off one. The alternative, waiting for the gates to appear upstream, delays the row until precisely the moment it stops being useful for adaptation: the value of the number is largest *before* activation, while wallets and programs can still respond to it. The row is therefore explicitly labelled and tooltipped as not-yet-active rather than presented as a fee.

**All three rates, not just the terminal one.** Showing only 1/2 would be the shortest row, and the terminal rate is where the model ends up. But the gates activate one at a time with an observation period between them, so for most of the ramp the terminal number is the wrong one to plan against. Three lines cost one row of vertical space and answer "what does this cost me at each stage" directly.

**`meta.costUnits` is the charge base.** SIMD-0553 charges requested cost units, which is the same quantity the scheduler packs blocks with, and the same quantity `getTransaction` reports as `meta.costUnits` — the cost model's saturating sum over signatures, write locks, instruction data, the *requested* compute unit limit, and the requested loaded-accounts data size. No reconstruction from Compute Budget instructions is needed, and no separate estimate can be more faithful than the number the RPC reports. Transactions from before the field was served simply have no row.

**The priority fee is backed out of the total, with a known gap.** `getTransaction` reports one summed `fee`, and the projection needs the priority component to carry it across unchanged, so the base half is subtracted at 5,000 lamports per signature. This reads high by 5,000 lamports per *precompile* signature on transactions that verify signatures through a precompile, because the signature count in the message does not cover those. The exact figure is preferred wherever the transaction states it — v1 declares its total priority fee on the message — and the alternative, parsing precompile instruction payloads to count their signatures, buys accuracy on a narrow class of transactions at the cost of a second signature-counting code path. The comparison percentage absorbs the error in the same direction for both models, so the row's headline answer (cheaper or costlier) does not flip.

**Behind an env flag, defaulted off.** The row states numbers from a draft proposal, so a deployment needs a way to withdraw it — if the rates move, if the SGP fails, or if the ramp schedule lands differently — without reverting the entity. `NEXT_PUBLIC_SIMD_0553_FEE_ENABLED` follows the flag pattern the receipt view and the stake total-reward row already use, read at the call site so tests can flip it. Defaulted off rather than on because a fee that is not active on any cluster is not something every deployment should assert by default; the alternative, shipping it on and reverting the commit if the SIMD changes, throws away the model along with the numbers.

**A percentage against the fee paid, not a lamport delta.** Two `◎` amounts per line read as a subtraction the reader has to perform; one signed percentage per line is the scannable form of "is this transaction cheaper or more expensive under the new model", which is the question the row exists to answer.

## What Changes

- **New entity `app/entities/transaction-fee/`** — `lib/resource-and-inclusion-fee.ts` holds the model: the inclusion fee and per-signature constants, the three staged rates, `getResourceFeeLamports` (the SIMD's `ceil_div` over integers), `projectResourceAndInclusionFees`, and `derivePriorityFeeLamports`. `ui/BaseResourceFeeProjection.tsx` renders one line per rate with a colour-coded percentage against the fee paid.
- **`app/entities/transaction-fee/env.ts` gates the row** on `NEXT_PUBLIC_SIMD_0553_FEE_ENABLED`, documented in `.env.example` and off by default.
- **The transaction summary card renders a "Fee under SIMD-0553" row** directly below the existing fee row, hidden unless the transaction reports both a fee and cost units. It reads the priority fee off a v1 message where one is declared and derives it otherwise.
- **The shared transaction fixture carries `costUnits`**, which mainnet has served for some time, so the summary card's stories exercise both this row and the pre-existing "Transaction cost" row. A new story covers a transaction that left a wallet's default 200,000 compute unit request in place.

## Impact

- **Additive on the transaction page, and off by default**: with the flag on, one row on transactions whose RPC response carries `costUnits`. Nothing existing changes shape, and a deployment that never sets the flag sees no change at all.
- **Tracks a draft proposal.** If SIMD-0553's rates, the inclusion fee, or the charge base change before activation, `RESOURCE_FEE_RATES` and the two constants are the whole of what has to follow. If it is rejected, the entity and the row are deleted together.
- **Storybook renders the row only when the flag is set** in the environment the build ran in, the same constraint the receipt view carries.
- **Deliberately not built:** hiding or relabelling the row once a gate activates (there is no gate to read yet), a resource fee estimate in the inspector for unsent transactions, and precompile-aware signature counting.
