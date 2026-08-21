import { render, screen, waitFor } from '@testing-library/react';
import { ClusterStatus } from '@utils/cluster';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/entities/cluster/lib/cluster';

const getSupply = vi.fn();
let clusterStatus: ClusterStatus = ClusterStatus.Connected;

vi.mock('@providers/cluster', () => ({
    getRpc: () => ({ getSupply }),
    useCluster: () => ({ cluster: Cluster.MainnetBeta, status: clusterStatus, url: 'https://rpc.test' }),
}));
vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn() } }));

import { SupplyProvider, useFetchSupply, useSupply } from '../supply';

beforeEach(() => {
    vi.clearAllMocks();
    clusterStatus = ClusterStatus.Connected;
    getSupply.mockReturnValue({
        send: () => Promise.resolve({ value: { circulating: 1n, nonCirculating: 2n, total: 3n } }),
    });
});

describe('SupplyProvider', () => {
    it('should report a failure when the cluster connection failed', async () => {
        // Nothing fetches on a failed connection, so without this the state would sit at idle and the
        // home page would render its skeletons forever.
        clusterStatus = ClusterStatus.Failure;

        renderProvider();

        await waitFor(() => expect(stateText()).toBe('failed: Failed to fetch supply'));
        expect(getSupply).not.toHaveBeenCalled();
    });

    it('should stay idle until a consumer asks, even when connected', () => {
        renderProvider();

        expect(stateText()).toBe('idle');
        expect(getSupply).not.toHaveBeenCalled();
    });

    it('should reach ready once a consumer asks', async () => {
        renderProvider({ fetchOnMount: true });

        await waitFor(() => expect(stateText()).toBe('ready'));
    });

    it('should report a failure when the supply request rejects', async () => {
        getSupply.mockReturnValue({ send: () => Promise.reject(new Error('rpc down')) });

        renderProvider({ fetchOnMount: true });

        await waitFor(() => expect(stateText()).toBe('failed: Failed to fetch supply'));
    });

    it('should keep a supply response that lands after the health check failed', async () => {
        // The health check and the supply request are separate calls: one can fail while the other is
        // still in flight and about to succeed. Reporting the failure over `loading` would discard the
        // response, leaving the home page on "Failed to fetch supply" with good data thrown away.
        let landResponse: () => void = () => {};
        getSupply.mockReturnValue({
            send: () =>
                new Promise(resolve => {
                    landResponse = () => resolve({ value: { circulating: 1n, nonCirculating: 2n, total: 3n } });
                }),
        });

        const { rerender } = renderProvider({ fetchOnMount: true });
        await waitFor(() => expect(stateText()).toBe('loading'));

        clusterStatus = ClusterStatus.Failure;
        rerender(providerTree({ fetchOnMount: true }));
        landResponse();

        await waitFor(() => expect(stateText()).toBe('ready'));
    });

    it('should keep supply already in hand when the health check fails', async () => {
        const { rerender } = renderProvider({ fetchOnMount: true });
        await waitFor(() => expect(stateText()).toBe('ready'));

        clusterStatus = ClusterStatus.Failure;
        rerender(providerTree({ fetchOnMount: true }));

        // Stale supply beats a synthesized failure, matching the rule in providers/cache-entry.
        expect(stateText()).toBe('ready');
    });
});

function renderProvider(options = {}) {
    return render(providerTree(options));
}

// Separate from `renderProvider` so a test can re-render the same tree after moving the cluster status.
function providerTree({ fetchOnMount = false } = {}) {
    return (
        <SupplyProvider>
            {fetchOnMount && <FetchOnMount />}
            <StateProbe />
        </SupplyProvider>
    );
}

const stateText = () => screen.getByTestId('state').textContent;

function StateProbe() {
    const state = useSupply();
    return <div data-testid="state">{state.kind === 'failed' ? `failed: ${state.message}` : state.kind}</div>;
}

// The provider leaves the first fetch to a consumer, which is what StakingComponent does on mount.
function FetchOnMount() {
    const fetchSupply = useFetchSupply();
    useEffect(() => fetchSupply(), [fetchSupply]);
    return undefined;
}
