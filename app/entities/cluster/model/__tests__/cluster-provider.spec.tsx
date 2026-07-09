import { render, screen, waitFor } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@solana/kit', () => ({ createSolanaRpc: vi.fn() }));
vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn() } }));

import { createSolanaRpc } from '@solana/kit';

import { ClusterStatus } from '../../lib/cluster';
import { ClusterProvider } from '../cluster-provider';
import { useCluster } from '../use-cluster';

function mockGenesis(send: () => Promise<string>) {
    vi.mocked(createSolanaRpc).mockReturnValue({
        getGenesisHash: () => ({ send }),
    } as unknown as ReturnType<typeof createSolanaRpc>);
}

function Probe() {
    const { status } = useCluster();
    return <div data-testid="status">{ClusterStatus[status]}</div>;
}

// Renders the real ClusterProvider with a shared SWR cache and jotai store so re-rendering with new
// searchParams models an in-app cluster switch (a key change on a mounted hook, not a remount).
function renderProvider(search: string) {
    const store = createStore();
    const cache = new Map();
    const onReplaceSearchParams = vi.fn();
    const swrValue = { dedupingInterval: 0, provider: () => cache };
    const tree = (params: string) => (
        <SWRConfig value={swrValue}>
            <Provider store={store}>
                <ClusterProvider
                    onReplaceSearchParams={onReplaceSearchParams}
                    searchParams={new URLSearchParams(params)}
                >
                    <Probe />
                </ClusterProvider>
            </Provider>
        </SWRConfig>
    );
    const view = render(tree(search));
    return { ...view, rerender: (params: string) => view.rerender(tree(params)) };
}

const statusText = () => screen.getByTestId('status').textContent;

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
});

describe('ClusterProvider connection status', () => {
    it('should report Failure when the genesis-hash health check rejects', async () => {
        mockGenesis(() => Promise.reject(new Error('rpc down')));

        renderProvider('cluster=devnet');

        await waitFor(() => expect(statusText()).toBe(ClusterStatus[ClusterStatus.Failure]));
    });

    it('should reconnect when returning to a cluster whose check previously failed', async () => {
        // Devnet is down at first, then the endpoint recovers.
        let shouldFail = true;
        mockGenesis(() => (shouldFail ? Promise.reject(new Error('rpc down')) : Promise.resolve('genesis')));

        const { rerender } = renderProvider('cluster=devnet');
        await waitFor(() => expect(statusText()).toBe(ClusterStatus[ClusterStatus.Failure]));

        shouldFail = false;
        // Switch to another cluster (recovered), then back to devnet.
        rerender('cluster=testnet');
        await waitFor(() => expect(statusText()).toBe(ClusterStatus[ClusterStatus.Connected]));

        rerender('cluster=devnet');
        // Returning to the failed cluster reconnects: SWR revalidates the error-only entry (no cached
        // `data`) when its key becomes active again, so a transient failure doesn't stick for the session.
        await waitFor(() => expect(statusText()).toBe(ClusterStatus[ClusterStatus.Connected]));
    });
});
