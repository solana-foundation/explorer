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
});

function renderProvider({ fetchOnMount = false } = {}) {
    return render(
        <SupplyProvider>
            {fetchOnMount && <FetchOnMount />}
            <StateProbe />
        </SupplyProvider>,
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
