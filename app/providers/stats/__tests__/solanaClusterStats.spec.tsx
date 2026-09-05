import { render, waitFor } from '@testing-library/react';
import { Cluster, clusterName, clusterSelection, ClusterStatus } from '@utils/cluster';
import { type ReactNode, useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Both from their own modules rather than the cluster barrel, which this file mocks.
import { toConnectableUrl } from '@/app/entities/cluster/lib/connectable-url';
import type { useCluster } from '@/app/entities/cluster/model/use-cluster';

import { SolanaClusterStatsProvider, useStatsProvider } from '../solanaClusterStats';

const CUSTOM_URL = 'https://my-node.test';
const FALLBACK_URL = 'https://api.mainnet-beta.solana.com';

const mocks = vi.hoisted(() => ({
    cluster: {} as ClusterContext,
    getRpc: vi.fn(),
}));

// The real return type, not a hand-written stand-in: a stand-in weaker than the context lets the provider
// read a field the real one no longer publishes, and types the endpoint as the plain string the brand
// exists to refuse.
type ClusterContext = ReturnType<typeof useCluster>;

function clusterContext({
    cluster,
    connectableUrl,
    status,
    url,
}: {
    cluster: Cluster;
    connectableUrl: string | undefined;
    status: ClusterStatus;
    url: string;
}): ClusterContext {
    const selection = clusterSelection(cluster, url);
    return {
        ...selection,
        connectableUrl: connectableUrl === undefined ? undefined : toConnectableUrl(connectableUrl),
        name: clusterName(cluster),
        selection,
        status,
        url,
    };
}

vi.mock('@providers/cluster', () => ({ getRpc: mocks.getRpc, useCluster: () => mocks.cluster }));

describe('SolanaClusterStatsProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Nothing settles, so the polling below cannot dispatch or fail its way out of the effect.
        mocks.getRpc.mockReturnValue(pendingRpc());
        mocks.cluster = clusterContext({
            cluster: Cluster.MainnetBeta,
            connectableUrl: FALLBACK_URL,
            status: ClusterStatus.Connected,
            url: FALLBACK_URL,
        });
    });

    it('should poll the endpoint the visitor has settled on', async () => {
        renderProvider();

        await waitFor(() => expect(mocks.getRpc).toHaveBeenCalledWith(FALLBACK_URL));
    });

    // The bug this gate exists for: `url` always resolves, and resolves to the fallback endpoint while a
    // custom URL waits for consent — so polling on it contacts a node the visitor never chose, behind a
    // prompt still asking about a different one.
    it('should contact nothing while a custom URL is still awaiting consent', async () => {
        mocks.cluster = clusterContext({
            cluster: Cluster.Custom,
            connectableUrl: undefined,
            status: ClusterStatus.Connecting,
            // What a consumer keying on `url` would have reached for, and must not.
            url: FALLBACK_URL,
        });

        renderProvider();
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(mocks.getRpc).not.toHaveBeenCalled();
    });

    it('should start polling once that consent is settled', async () => {
        mocks.cluster = clusterContext({
            cluster: Cluster.Custom,
            connectableUrl: undefined,
            status: ClusterStatus.Connecting,
            url: FALLBACK_URL,
        });

        const { rerender } = renderProvider();
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(mocks.getRpc).not.toHaveBeenCalled();

        mocks.cluster = clusterContext({
            cluster: Cluster.Custom,
            connectableUrl: CUSTOM_URL,
            status: ClusterStatus.Connected,
            url: CUSTOM_URL,
        });
        rerender(providerTree());

        await waitFor(() => expect(mocks.getRpc).toHaveBeenCalledWith(CUSTOM_URL));
    });
});

/** The cards poll only once something asks them to, so a test that never activates proves nothing. */
function Activate() {
    const { setActive } = useStatsProvider();

    useEffect(() => setActive(true), [setActive]);

    return undefined;
}

function providerTree(): ReactNode {
    return (
        <SolanaClusterStatsProvider>
            <Activate />
        </SolanaClusterStatsProvider>
    );
}

function renderProvider() {
    return render(providerTree());
}

/** Every call left in flight, so the effect neither dispatches nor unwinds while the test looks at it. */
function pendingRpc() {
    const pending = () => ({ send: () => new Promise(() => {}) });

    return {
        getBlockTime: pending,
        getEpochInfo: pending,
        getRecentPerformanceSamples: pending,
        getTransactionCount: pending,
    };
}
