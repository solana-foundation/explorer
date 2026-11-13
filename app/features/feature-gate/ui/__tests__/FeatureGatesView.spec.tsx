import { useSlotTime } from '@entities/slot-time';
import { fireEvent, render, screen } from '@testing-library/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCluster, useClusterInfo } from '@/app/providers/cluster';
import { Cluster } from '@/app/utils/cluster';

import { FeatureGatesView } from '../FeatureGatesView';

const { partitionFeatures, push } = vi.hoisted(() => ({
    partitionFeatures: vi.fn(() => ({ activated: [], upcoming: [] })),
    push: vi.fn(),
}));

vi.mock('@/app/providers/cluster', () => ({
    useCluster: vi.fn(() => ({ cluster: Cluster.MainnetBeta })),
    useClusterInfo: vi.fn(() => undefined),
}));

vi.mock('@entities/slot-time', () => ({
    useSlotTime: vi.fn(() => undefined),
}));

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(() => '/feature-gates'),
    useRouter: vi.fn(() => ({ push })),
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('../../lib/partition-features', () => ({ partitionFeatures }));

type SecondColumn = { sort?: { direction: string; onToggle: () => void } };

// `useSearchParams` is typed to return the read-only variant; the test seeds a plain one.
const searchParams = (init?: string) => new URLSearchParams(init) as unknown as ReturnType<typeof useSearchParams>;

// Only the Activated table carries `sort`; render a toggle for it so the sort-URL wiring can be exercised.
vi.mock('../FeatureGateTable', () => ({
    EmptyStateCard: () => null,
    FeatureGateTable: ({ secondColumn }: { secondColumn: SecondColumn }) =>
        secondColumn.sort ? <button onClick={secondColumn.sort.onToggle}>sort</button> : null,
    OtherActivationsCell: () => null,
    ShowMoreButton: () => null,
}));

const withActivated = () =>
    partitionFeatures.mockReturnValue({ activated: [{ clusterActivationEpoch: 10 }], upcoming: [] } as ReturnType<
        typeof partitionFeatures
    >);

beforeEach(() => {
    vi.mocked(useCluster).mockReturnValue({ cluster: Cluster.MainnetBeta } as ReturnType<typeof useCluster>);
    partitionFeatures.mockReturnValue({ activated: [], upcoming: [] });
    vi.mocked(useClusterInfo).mockReturnValue(undefined);
    vi.mocked(useSlotTime).mockReturnValue(undefined);
    vi.mocked(usePathname).mockReturnValue('/feature-gates');
    vi.mocked(useSearchParams).mockReturnValue(searchParams());
    push.mockClear();
});

describe('FeatureGatesView', () => {
    describe('polling gate', () => {
        it('should enable the epoch and slot-time queries on a standard cluster', () => {
            render(<FeatureGatesView />);

            expect(useClusterInfo).toHaveBeenCalledWith({ enabled: true });
            expect(useSlotTime).toHaveBeenCalledWith({ enabled: true });
        });

        it('should defer both queries on a custom cluster, showing the custom-cluster card', () => {
            vi.mocked(useCluster).mockReturnValue({ cluster: Cluster.Custom } as ReturnType<typeof useCluster>);

            render(<FeatureGatesView />);

            expect(useClusterInfo).toHaveBeenCalledWith({ enabled: false });
            expect(useSlotTime).toHaveBeenCalledWith({ enabled: false });
            expect(screen.getByText('Custom cluster')).toBeInTheDocument();
        });
    });

    describe('sort direction in the URL', () => {
        it('should write a dir param when toggling off the default', () => {
            withActivated();
            render(<FeatureGatesView />);

            fireEvent.click(screen.getByRole('button', { name: 'sort' }));

            expect(push).toHaveBeenCalledWith('/feature-gates?dir=asc', { scroll: false });
        });

        it('should drop the dir param when toggling back to the default', () => {
            withActivated();
            vi.mocked(useSearchParams).mockReturnValue(searchParams('dir=asc'));
            render(<FeatureGatesView />);

            fireEvent.click(screen.getByRole('button', { name: 'sort' }));

            expect(push).toHaveBeenCalledWith('/feature-gates', { scroll: false });
        });

        it('should preserve other params when the sort changes', () => {
            withActivated();
            vi.mocked(useSearchParams).mockReturnValue(searchParams('cluster=devnet'));
            render(<FeatureGatesView />);

            fireEvent.click(screen.getByRole('button', { name: 'sort' }));

            expect(push).toHaveBeenCalledWith('/feature-gates?cluster=devnet&dir=asc', { scroll: false });
        });
    });
});
