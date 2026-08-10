import { gen } from '@__fixtures__/gen';
import { address } from '@solana/kit';
import { renderHook, waitFor } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useTotalReward } from '../use-total-reward';

const STAKE_ACCOUNT_ADDRESS = address(gen.address(0));

const mocks = vi.hoisted(() => ({ cluster: { cluster: 0 } }));

vi.mock('@entities/cluster', () => ({ useCluster: () => mocks.cluster }));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('useTotalReward', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.cluster = { cluster: Cluster.MainnetBeta };
    });

    it('should report loading before the request resolves', () => {
        fetchMock.mockReturnValue(new Promise(() => {}));

        expect(renderTotalReward().result.current).toEqual({ status: 'loading' });
    });

    it('should report the total once the request resolves', async () => {
        fetchMock.mockResolvedValue(totalResponse(4_200_824));

        const { result } = renderTotalReward();

        await waitFor(() => expect(result.current).toEqual({ lamports: 4_200_824, status: 'ready' }));
    });

    it('should request the route for the stake account address', async () => {
        fetchMock.mockResolvedValue(totalResponse(1));

        renderTotalReward();

        await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(`/api/stake-rewards/${STAKE_ACCOUNT_ADDRESS}`));
    });

    it('should report unavailable when the route fails', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 502 } as Response);

        const { result } = renderTotalReward();

        await waitFor(() => expect(result.current).toEqual({ status: 'unavailable' }));
    });

    it('should report a zero total as ready, not unavailable', async () => {
        fetchMock.mockResolvedValue(totalResponse(0));

        const { result } = renderTotalReward();

        await waitFor(() => expect(result.current).toEqual({ lamports: 0, status: 'ready' }));
    });

    it('should not call the route on a cluster Solscan does not index', () => {
        mocks.cluster = { cluster: Cluster.Devnet };

        expect(renderTotalReward().result.current).toEqual({ status: 'unavailable' });
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

/**
 * A fresh SWR cache per test. `useSWRImmutable` never revalidates, so a shared cache would let one
 * test's result — including a pending promise — satisfy the next test's identical key.
 */
function renderTotalReward() {
    const wrapper = ({ children }: { children: ReactNode }) => (
        <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
    );
    return renderHook(() => useTotalReward(STAKE_ACCOUNT_ADDRESS), { wrapper });
}

function totalResponse(totalReward: number): Response {
    return { json: () => Promise.resolve({ totalReward }), ok: true } as Response;
}
