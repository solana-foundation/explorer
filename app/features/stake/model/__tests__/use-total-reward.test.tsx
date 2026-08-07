import { renderHook, waitFor } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { STAKE_ACCOUNT_ADDRESS } from '../../__fixtures__/stake-account';
import { useTotalReward } from '../use-total-reward';

const mocks = vi.hoisted(() => ({ cluster: { cluster: 0, url: '' } }));

vi.mock('@/app/providers/cluster', () => ({ useCluster: () => mocks.cluster }));

describe('useTotalReward', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.cluster = { cluster: Cluster.MainnetBeta, url: 'https://rpc.example' };
        global.fetch = vi.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('should report loading before the request resolves', () => {
        vi.mocked(global.fetch).mockReturnValue(new Promise(() => {}));

        expect(renderTotalReward().result.current).toEqual({ status: 'loading' });
    });

    it('should report the total once the request resolves', async () => {
        vi.mocked(global.fetch).mockResolvedValue(makeTotalResponse(4200824));

        const { result } = renderTotalReward();

        await waitFor(() => expect(result.current).toEqual({ lamports: 4200824, status: 'ready' }));
    });

    it('should request the route with the current cluster', async () => {
        vi.mocked(global.fetch).mockResolvedValue(makeTotalResponse(1));

        renderTotalReward();

        await waitFor(() =>
            expect(global.fetch).toHaveBeenCalledWith(
                `/api/stake-rewards/${STAKE_ACCOUNT_ADDRESS}?cluster=${Cluster.MainnetBeta}`,
            ),
        );
    });

    it('should report unavailable when the route fails', async () => {
        vi.mocked(global.fetch).mockResolvedValue({ ok: false, status: 502 } as Response);

        const { result } = renderTotalReward();

        await waitFor(() => expect(result.current).toEqual({ status: 'unavailable' }));
    });

    it('should report a zero total as ready, not unavailable', async () => {
        vi.mocked(global.fetch).mockResolvedValue(makeTotalResponse(0));

        const { result } = renderTotalReward();

        await waitFor(() => expect(result.current).toEqual({ lamports: 0, status: 'ready' }));
    });

    it('should not call the route on a custom cluster the server cannot reach', () => {
        mocks.cluster = { cluster: Cluster.Custom, url: 'http://localhost:8899' };

        expect(renderTotalReward().result.current).toEqual({ status: 'unavailable' });
        expect(global.fetch).not.toHaveBeenCalled();
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

function makeTotalResponse(totalReward: number): Response {
    return { json: () => Promise.resolve({ totalReward }), ok: true } as Response;
}
