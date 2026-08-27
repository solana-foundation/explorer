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

// A sentinel, not an empty string: the failure to catch is the endpoint being absent from the context
// altogether, which every fetching hook reads as "wait".
const NOTHING_TO_CONNECT_TO = 'nothing-to-connect-to';

function Probe() {
    const { connectableUrl, status } = useCluster();
    return (
        <>
            <div data-testid="status">{ClusterStatus[status]}</div>
            <div data-testid="connectable">{connectableUrl ?? NOTHING_TO_CONNECT_TO}</div>
        </>
    );
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
const connectableText = () => screen.getByTestId('connectable').textContent;

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Approvals live in sessionStorage, so one test's approved origin would otherwise carry into the next.
    sessionStorage.clear();
});

// Three consumers now gate their requests on this one context field, and its type is optional, so
// dropping it from the provider value fails nothing at the type level: the home page would simply wait
// for an endpoint that never arrives, on every cluster.
describe('ClusterProvider connectable endpoint', () => {
    it('should publish the endpoint for a cluster that needs no decision', async () => {
        mockGenesis(() => Promise.resolve('genesis'));

        renderProvider('cluster=devnet');

        await waitFor(() => expect(statusText()).toBe(ClusterStatus[ClusterStatus.Connected]));
        expect(connectableText()).toContain('devnet');
    });

    it('should publish nothing, and connect to nothing, while a custom URL awaits consent', async () => {
        mockGenesis(() => Promise.resolve('genesis'));

        renderProvider('cluster=custom&customUrl=https://my-node.example/rpc');

        expect(connectableText()).toBe(NOTHING_TO_CONNECT_TO);
        // The gate, not just the value: without it the health check contacts the fallback endpoint — a
        // node the visitor never chose — while the consent prompt is still on screen.
        expect(createSolanaRpc).not.toHaveBeenCalled();
        expect(statusText()).toBe(ClusterStatus[ClusterStatus.Connecting]);
    });

    it('should publish a custom endpoint once its origin is approved', async () => {
        mockGenesis(() => Promise.resolve('genesis'));
        sessionStorage.setItem('explorer:approvedRpcOrigins', JSON.stringify(['https://my-node.example']));

        renderProvider('cluster=custom&customUrl=https://my-node.example/rpc');

        await waitFor(() => expect(connectableText()).toBe('https://my-node.example/rpc'));
        expect(createSolanaRpc).toHaveBeenCalledWith('https://my-node.example/rpc');
    });
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
