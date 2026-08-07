import { clusterFromParam, serverClusterUrlFromParam } from '@entities/cluster/server';
import {
    getCreationEpoch,
    getOldestSignatureSlot,
    getRewardEpochRange,
    type RewardEpochRange,
    SignatureHistoryUnavailableError,
    sumInflationRewards,
} from '@entities/stake-rewards/server';
import { parseStakeDelegation, type StakeDelegation } from '@features/stake/server';
import { CACHE_HEADERS, isTimeoutError } from '@shared/lib/http-utils';
import { type Address, address, createSolanaRpc } from '@solana/kit';
import { NextResponse } from 'next/server';

import { Logger } from '@/app/shared/lib/logger';

/**
 * The sweep bounds itself well inside this (see `SWEEP_BUDGET_MS`); this is the backstop for the
 * two calls below plus response overhead. Declared rather than inherited, so the ceiling the sweep
 * budget is chosen against is visible here.
 */
export const maxDuration = 60;

/** Applies to the two calls that precede the sweep. The sweep sets its own per-call ceiling. */
const RPC_TIMEOUT_MS = 10_000;

/**
 * Lifetime inflation-reward total for one stake account.
 *
 * The sweep costs one RPC call per epoch on a cold cache, so this endpoint exists to pay that once
 * and share it: `CACHE_HEADERS` holds the response at the CDN, and each epoch's RPC response is
 * cached on its own underneath (see `sumInflationRewards`).
 *
 * Error policy: a partial total cannot be told apart from a correct one, so any epoch that fails
 * fails the whole request with an *uncached* 502 — caching the failure would pin it for the full
 * four-hour success window. A timeout answers 504 on the same terms. Leaving it uncached is what
 * makes a long cold sweep viable: each epoch is cached on its own, so a repeat request resumes from
 * the progress the timed-out one made. A cached error would block those retries for its whole TTL
 * and stall the sweep short of an answer.
 *
 * This composes the pieces here rather than in a slice because the parse lives in the stake feature
 * and the reward math in the stake-rewards entity; only a route may reach into both.
 */
export async function GET(request: Request, { params }: { params: Promise<{ address: string }> }) {
    const { address: addressParam } = await params;
    const clusterParam = new URL(request.url).searchParams.get('cluster');

    if (!clusterParam) {
        return NextResponse.json({ error: 'Missing cluster' }, { status: 400 });
    }

    const cluster = clusterFromParam(clusterParam);
    const url = serverClusterUrlFromParam(clusterParam);
    if (cluster === undefined || !url) {
        return NextResponse.json({ error: 'Invalid cluster' }, { status: 400 });
    }

    let stakeAccount: Address;
    try {
        stakeAccount = address(addressParam);
    } catch {
        return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    const logContext = { address: addressParam, cluster: clusterParam };

    /**
     * Hoisted so a timeout can report the range it was sweeping. The epoch count is the fact that
     * separates the two causes: an upstream that went slow, or a range that never fit the budget.
     * Stays `undefined` when the timeout hit one of the two calls that precede the sweep.
     */
    let sweptRange: RewardEpochRange | undefined;

    try {
        const rpc = createSolanaRpc(url);
        // The signature walk joins the two calls already here rather than following them: it needs
        // only the address, so it costs the request nothing beyond the slowest of the three.
        const [epochInfo, accountInfo, oldestSlot] = await Promise.all([
            rpc.getEpochInfo().send({ abortSignal: AbortSignal.timeout(RPC_TIMEOUT_MS) }),
            rpc
                .getAccountInfo(stakeAccount, { encoding: 'jsonParsed' })
                .send({ abortSignal: AbortSignal.timeout(RPC_TIMEOUT_MS) }),
            getOldestSignatureSlot({
                abortSignal: AbortSignal.timeout(RPC_TIMEOUT_MS),
                address: stakeAccount,
                rpc,
            }),
        ]);

        const delegation = parseStakeDelegation(accountInfo.value);
        if (delegation.kind !== 'delegated') {
            return notDelegatedResponse(delegation.kind);
        }

        sweptRange = getRewardEpochRange({
            cluster,
            // Not `delegation.activationEpoch`: re-delegating resets that to the latest delegation,
            // so it omits everything an earlier delegation earned.
            creationEpoch: getCreationEpoch({ epochInfo, oldestSlot }),
            // kit returns the epoch as a bigint; the range rule works in numbers, and an epoch
            // count stays far below the safe integer range.
            currentEpoch: Number(epochInfo.epoch),
            deactivationEpoch: delegation.deactivationEpoch,
        });

        // No completed reward epochs yet — a real total of zero, not a failure.
        if (!sweptRange) {
            return NextResponse.json({ totalReward: 0 }, { headers: CACHE_HEADERS, status: 200 });
        }

        const totalReward = await sumInflationRewards({ address: addressParam, range: sweptRange, url });

        return NextResponse.json(
            { fromEpoch: sweptRange.fromEpoch, toEpoch: sweptRange.toEpoch, totalReward },
            { headers: CACHE_HEADERS, status: 200 },
        );
    } catch (error) {
        // No total rather than a short one. Substituting `activationEpoch` here would answer 200
        // with a figure wrong by an unknown amount, which is the one outcome this endpoint must
        // not produce. The card renders its `unavailable` state, not a zero.
        if (error instanceof SignatureHistoryUnavailableError) {
            Logger.warn('[api:stake-rewards] Could not date the account from its signature history', {
                ...logContext,
                reason: error.message,
            });
            return NextResponse.json({ error: 'Cannot determine account creation epoch' }, { status: 502 });
        }

        // Warn rather than page: an unreachable or slow upstream is not an application fault.
        if (isTimeoutError(error)) {
            // Told apart from a 502 because the cure differs: a timed-out sweep made real progress,
            // and the caller only has to ask again to resume it.
            //
            // Reported to Sentry because the budget is a guess that only production can settle. The
            // message stays static so every timeout groups into one issue; the varying facts go to
            // `sentryExtras`, which is the only part of this context Sentry receives.
            Logger.warn('[api:stake-rewards] Timed out resolving total reward', {
                ...logContext,
                sentry: true,
                sentryExtras: {
                    ...logContext,
                    ...(sweptRange && {
                        epochCount: sweptRange.toEpoch - sweptRange.fromEpoch + 1,
                        fromEpoch: sweptRange.fromEpoch,
                        toEpoch: sweptRange.toEpoch,
                    }),
                    // Distinguishes a timeout inside the sweep from one in the calls before it.
                    phase: sweptRange ? 'sweep' : 'account-lookup',
                },
            });
            return NextResponse.json({ error: 'Upstream RPC timeout' }, { status: 504 });
        }

        // Every epoch already retries with backoff, so reaching here means the RPC stayed unhealthy.
        Logger.warn('[api:stake-rewards] Failed to resolve total reward', {
            ...logContext,
            rpcError: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ error: 'Upstream RPC error' }, { status: 502 });
    }
}

/**
 * Client errors are kept apart so the caller learns *why* there is no total. None carry cache
 * headers: an account can be created or delegated at any time, and a cached 404 would outlive it.
 */
function notDelegatedResponse(kind: Exclude<StakeDelegation['kind'], 'delegated'>) {
    switch (kind) {
        case 'not-found':
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        case 'not-a-stake-account':
            return NextResponse.json({ error: 'Not a stake account' }, { status: 400 });
        case 'undelegated':
            return NextResponse.json({ error: 'Stake account has never been delegated' }, { status: 400 });
    }
}
