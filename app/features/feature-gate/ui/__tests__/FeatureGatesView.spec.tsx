import { useSlotTime } from '@entities/slot-time';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCluster, useClusterInfo } from '@/app/providers/cluster';
import { Cluster } from '@/app/utils/cluster';

import { FeatureGatesView } from '../FeatureGatesView';

const { partitionFeatures } = vi.hoisted(() => ({
    partitionFeatures: vi.fn(() => ({ activated: [], upcoming: [] })),
}));

vi.mock('@/app/providers/cluster', () => ({
    useCluster: vi.fn(() => ({ cluster: Cluster.MainnetBeta })),
    useClusterInfo: vi.fn(() => undefined),
}));

vi.mock('@entities/slot-time', () => ({
    useSlotTime: vi.fn(() => undefined),
}));

vi.mock('../../lib/partition-features', () => ({ partitionFeatures }));

type TableProps = {
    features: unknown[];
    secondColumn: { render: (feature: unknown) => ReactNode };
};

vi.mock('../FeatureGateTable', () => ({
    EmptyStateCard: () => null,
    FeatureGateTable: ({ features, secondColumn }: TableProps) =>
        features.map((feature, index) => <div key={index}>{secondColumn.render(feature)}</div>),
}));

describe('FeatureGatesView', () => {
    beforeEach(() => {
        vi.mocked(useCluster).mockReturnValue({ cluster: Cluster.MainnetBeta } as ReturnType<typeof useCluster>);
        partitionFeatures.mockReturnValue({ activated: [], upcoming: [] });
        vi.mocked(useClusterInfo).mockReturnValue(undefined);
        vi.mocked(useSlotTime).mockReturnValue(undefined);
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

    it('should render a countdown when cluster info and slot time are both available', () => {
        partitionFeatures.mockReturnValue({
            activated: [{ clusterActivationEpoch: 10 }],
            upcoming: [],
        } as unknown as ReturnType<typeof partitionFeatures>);
        vi.mocked(useClusterInfo).mockReturnValue({
            epochInfo: { epoch: 5n, slotIndex: 0n, slotsInEpoch: 100n },
            epochSchedule: { slotsPerEpoch: 100n },
        } as ReturnType<typeof useClusterInfo>);
        vi.mocked(useSlotTime).mockReturnValue(400);

        render(<FeatureGatesView />);

        expect(screen.getByText(content => content.startsWith('in ~'))).toBeInTheDocument();
    });
});
