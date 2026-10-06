import { gen } from '@__fixtures__/gen';
import { address } from '@solana/kit';
import { renderHook } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FAST_RETRY, settleRetries, swrWrapper, waitForHook } from '@/app/__tests__/swr-hook';

import { TotalRewardStatus, useTotalReward } from '../use-total-reward';

const STAKE_ACCOUNT_ADDRESS = address(gen.address(0));

const mocks = vi.hoisted(() => ({ cluster: { cluster: 0 } }));

vi.mock('@entities/cluster', () => ({ useCluster: () => mocks.cluster }));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('useTotalReward', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('NEXT_PUBLIC_STAKE_TOTAL_REWARD_ENABLED', 'true');
        mocks.cluster = { cluster: Cluster.MainnetBeta };
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('should report loading before the request resolves', () => {
        fetchMock.mockReturnValue(new Promise(() => {}));

        expect(renderTotalReward().result.current).toEqual({ status: TotalRewardStatus.Loading });
    });

    it('should report the total once the request resolves', async () => {
        fetchMock.mockResolvedValue(totalResponse(4_200_824));

        const { result } = renderTotalReward();

        await waitForHook(() =>
            expect(result.current).toEqual({ lamports: 4_200_824, status: TotalRewardStatus.Ready }),
        );
    });

    it('should request the route for the stake account address', async () => {
        fetchMock.mockResolvedValue(totalResponse(1));

        renderTotalReward();

        await waitForHook(() => expect(fetchMock).toHaveBeenCalledWith(`/api/stake-rewards/${STAKE_ACCOUNT_ADDRESS}`));
    });

    it('should report unavailable when the route fails', async () => {
        fetchMock.mockResolvedValue(failedResponse(502));

        const { result } = renderTotalReward();

        await waitForHook(() => expect(result.current).toEqual({ status: TotalRewardStatus.Unavailable }));
    });

    it('should report a zero total as ready, not unavailable', async () => {
        fetchMock.mockResolvedValue(totalResponse(0));

        const { result } = renderTotalReward();

        await waitForHook(() => expect(result.current).toEqual({ lamports: 0, status: TotalRewardStatus.Ready }));
    });

    it('should report disabled without calling the route when the feature is off', () => {
        vi.stubEnv('NEXT_PUBLIC_STAKE_TOTAL_REWARD_ENABLED', 'false');

        expect(renderTotalReward().result.current).toEqual({ status: TotalRewardStatus.Disabled });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should not call the route on a cluster Solscan does not index', () => {
        mocks.cluster = { cluster: Cluster.Devnet };

        expect(renderTotalReward().result.current).toEqual({ status: TotalRewardStatus.Unsupported });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([
        ['a failure the route may answer differently', 502],
        ['a rate limit, which the route answers once its window resets', 429],
    ])('should retry %s', async (_reason, status) => {
        fetchMock.mockResolvedValue(failedResponse(status));

        renderTotalReward();

        await waitForHook(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(1));
    });

    it.each([
        ['a malformed address or a non-mainnet cluster', 400],
        ['an address the route will not answer for', 404],
        ['a deployment with no key configured', 503],
    ])('should not retry a refusal for %s', async (_reason, status) => {
        fetchMock.mockResolvedValue(failedResponse(status));

        const { result } = renderTotalReward();

        await waitForHook(() => expect(result.current).toEqual({ status: TotalRewardStatus.Unavailable }));
        await settleRetries();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});

function renderTotalReward() {
    return renderHook(() => useTotalReward(STAKE_ACCOUNT_ADDRESS), { wrapper: swrWrapper(FAST_RETRY) });
}

function totalResponse(totalReward: number): Response {
    return { json: () => Promise.resolve({ totalReward }), ok: true } as Response;
}

function failedResponse(status: number): Response {
    return { ok: false, status } as Response;
}
