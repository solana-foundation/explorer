import { type Address } from '@solana/kit';
import { create } from 'superstruct';

import { fetchUpstream } from '@/app/shared/lib/http-utils';

import { SolscanRequestError, SolscanResponseError } from '../lib/errors';
import { SolscanStakeReward, SolscanStakeRewardResponse } from '../lib/validators';

const SOLSCAN_BASE_URL = 'https://pro-api.solscan.io/v2.0';

/**
 * Rewards are paid once per epoch (~2.1 days), so one page of 100 covers about 7 months. The
 * endpoint documents `page_size` without listing its accepted values; 100 is the assumption to
 * re-check first if a request comes back 400.
 */
const PAGE_SIZE = 100;

/**
 * A hard stop on paging. Mainnet-beta is ~1000 epochs old, so 30 pages is far more history than any
 * account can hold. Reaching it means the API is not terminating the way we expect, and we fail
 * rather than return a total that silently stopped partway.
 */
const MAX_PAGES = 30;

/**
 * Mainnet-beta genesis, 2020-03-16. No reward can predate the cluster, so this is a correct floor
 * for the range — and passing it explicitly avoids Solscan's 1-month default window, which would
 * silently return a month's rewards under a "total" label.
 */
const MAINNET_GENESIS_UNIX = 1_584_316_800;

/** SOL is always 9 decimals. Any other value means `amount` is not in lamports. */
const SOL_DECIMALS = 9;

export type StakeRewardTotal = {
    /** Lifetime inflation reward, in lamports. */
    lamports: number;
    /** How many epochs paid a reward. Logged, not displayed — it separates "no history" from a real 0. */
    epochs: number;
};

/**
 * Sum a stake account's lifetime inflation rewards from Solscan.
 *
 * The figure cannot come from the account state: each epoch's reward is added to both the lamport
 * balance and `delegation.stake`, and the principal at delegation time is never stored, so the two
 * are indistinguishable on chain.
 *
 * **Why not `account/stake`, which returns a precomputed `total_reward`.** That endpoint is "the
 * list of stake accounts of an account" and its `address` parameter is documented as a wallet, so
 * the total is reachable only by listing a wallet's stake accounts and finding the right row. From a
 * stake account page we hold the stake account address, and `account/stake/reward` is the only
 * endpoint that documents taking one. Reaching `total_reward` instead would mean querying
 * `meta.authorized.withdrawer` and paging its listing 40 at a time until our row appears — one
 * request for a small staker, unbounded for a large one. Summing epochs is bounded by account age.
 *
 * Server-only — it carries the API key.
 */
export async function fetchTotalStakeReward({
    address,
    apiKey,
}: {
    address: Address;
    apiKey: string;
}): Promise<StakeRewardTotal> {
    let lamports = 0;
    let epochs = 0;

    for (let page = 1; page <= MAX_PAGES; page++) {
        const rows = await fetchRewardPage({ address, apiKey, page });

        for (const row of rows) {
            if (row.decimals !== SOL_DECIMALS) {
                throw new SolscanResponseError(`Unexpected decimals ${row.decimals} in Solscan stake reward`);
            }
            lamports += row.amount;
        }
        epochs += rows.length;

        // Solscan returns no total count, so a short page is the only termination signal.
        if (rows.length < PAGE_SIZE) {
            // Rewards are non-negative, so the running total only grows: if the result is within
            // safe-integer range, every intermediate add was exact. Past 2^53 `+=` rounds silently,
            // and a total that is quietly wrong is worse than none.
            if (!Number.isSafeInteger(lamports)) {
                throw new Error(`Total reward for ${address} exceeds safe integer range: ${lamports}`);
            }
            return { epochs, lamports };
        }
    }

    throw new Error(`Stake reward history for ${address} exceeded ${MAX_PAGES} pages`);
}

async function fetchRewardPage({
    address,
    apiKey,
    page,
}: {
    address: Address;
    apiKey: string;
    page: number;
}): Promise<SolscanStakeReward[]> {
    const query = new URLSearchParams({
        address,
        from_time: String(MAINNET_GENESIS_UNIX),
        page: String(page),
        page_size: String(PAGE_SIZE),
        to_time: String(Math.floor(Date.now() / 1000)),
    });

    // One attempt per page, no retry. Solscan meters by request and enforces a per-minute cap, so
    // retrying burns quota and makes a rate limit worse. A failed page fails the whole total —
    // a partial sum is wrong by an unknown amount and still looks authoritative.
    const response = await fetchUpstream(`${SOLSCAN_BASE_URL}/account/stake/reward?${query}`, {
        headers: { token: apiKey },
    });

    if (!response.ok) {
        throw new SolscanRequestError(`Stake reward page ${page} failed`, { status: response.status });
    }

    const body = parseRewardPage(await response.json());

    // Solscan can answer 200 with `success: false`. Reading `data` straight off that body would
    // take the absent rows for a short page, end the sweep, and return a total that stopped early —
    // the exact silent-undercount this fetcher exists to avoid.
    if (!body.success) {
        const reason = body.errors?.message ?? 'no reason given';
        throw new SolscanResponseError(`Solscan reported a failure on stake reward page ${page}: ${reason}`);
    }
    if (!body.data) {
        throw new SolscanResponseError(`Stake reward page ${page} succeeded but carried no data`);
    }

    return body.data;
}

/** Wraps superstruct's `StructError` so a contract change is distinguishable from a bug of ours. */
function parseRewardPage(body: unknown): SolscanStakeRewardResponse {
    try {
        return create(body, SolscanStakeRewardResponse);
    } catch (error) {
        throw new SolscanResponseError('Stake reward response did not match the expected shape', { cause: error });
    }
}
