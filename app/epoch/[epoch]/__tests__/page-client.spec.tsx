import { FetchStatus } from '@providers/cache';
import { render, screen } from '@testing-library/react';
import { ClusterStatus } from '@utils/cluster';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let epochState: { status: FetchStatus } | undefined;

vi.mock('@providers/cluster', () => ({
    useCluster: () => ({ status: ClusterStatus.Failure }),
    // Only fetches once the cluster is connected, so it stays undefined on a failed connection.
    useClusterInfo: () => undefined,
}));
vi.mock('@providers/epoch', () => ({
    useEpoch: () => epochState,
    useFetchEpoch: () => vi.fn(),
}));

import EpochDetailsPageClient from '../page-client';

beforeEach(() => {
    epochState = undefined;
});

describe('EpochDetailsPageClient', () => {
    it('should report the failure instead of loading forever when the epoch entry failed', () => {
        // What `useEpoch` reports on a dead connection: the cache turns a never-requested entry into a
        // failure (see providers/cache-entry). `clusterInfo` is unresolved too, so branch order decides.
        epochState = { status: FetchStatus.FetchFailed };

        renderPage();

        expect(screen.getByText('Failed to fetch details for epoch 520')).toBeInTheDocument();
        expect(screen.queryByText('Connecting to cluster')).not.toBeInTheDocument();
    });

    it('should keep loading while nothing has failed yet', () => {
        renderPage();

        expect(screen.getByText('Connecting to cluster')).toBeInTheDocument();
        expect(screen.queryByText('Failed to fetch details for epoch 520')).not.toBeInTheDocument();
    });
});

function renderPage() {
    return render(<EpochDetailsPageClient params={{ epoch: '520' }} />);
}
