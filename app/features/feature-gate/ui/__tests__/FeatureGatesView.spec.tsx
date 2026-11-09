import { useSlotTime } from '@entities/slot-time';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCluster, useClusterInfo } from '@/app/providers/cluster';
import { Cluster } from '@/app/utils/cluster';

import { FeatureGatesView } from '../FeatureGatesView';

vi.mock('@/app/providers/cluster', () => ({
    useCluster: vi.fn(() => ({ cluster: Cluster.MainnetBeta })),
    useClusterInfo: vi.fn(() => undefined),
}));

vi.mock('@entities/slot-time', () => ({
    useSlotTime: vi.fn(() => undefined),
}));

vi.mock('../../lib/partition-features', () => ({
    partitionFeatures: () => ({ activated: [], upcoming: [] }),
}));

vi.mock('../FeatureGateTable', () => ({
    EmptyStateCard: () => null,
    FeatureGateTable: () => null,
}));

describe('FeatureGatesView', () => {
    beforeEach(() => {
        vi.mocked(useCluster).mockReturnValue({ cluster: Cluster.MainnetBeta } as ReturnType<typeof useCluster>);
    });

    it('should poll cluster info and slot time on a standard cluster', () => {
        render(<FeatureGatesView />);

        expect(useClusterInfo).toHaveBeenCalledWith({ enabled: true });
        expect(useSlotTime).toHaveBeenCalledWith({ enabled: true });
    });

    it('should not poll cluster info or slot time on a custom cluster', () => {
        vi.mocked(useCluster).mockReturnValue({ cluster: Cluster.Custom } as ReturnType<typeof useCluster>);

        render(<FeatureGatesView />);

        expect(useClusterInfo).toHaveBeenCalledWith({ enabled: false });
        expect(useSlotTime).toHaveBeenCalledWith({ enabled: false });
    });
});
