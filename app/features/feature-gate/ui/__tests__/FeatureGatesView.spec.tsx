import { useSlotTime } from '@entities/slot-time';
import { fireEvent, render, screen } from '@testing-library/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { type ReactNode } from 'react';
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

type Feature = { clusterActivationEpoch?: number };
type SecondColumn = {
    render: (feature: Feature) => ReactNode;
    sort?: { direction: string; onToggle: () => void };
};
type TableProps = { features: Feature[]; secondColumn: SecondColumn; footer?: ReactNode };

// `useSearchParams` is typed to return the read-only variant; the test seeds a plain one.
const searchParams = (init?: string) => new URLSearchParams(init) as unknown as ReturnType<typeof useSearchParams>;

// Text/name matchers by prefix, since the section headings carry a trailing record count.
const startsWith = (prefix: string) => (text: string) => text.startsWith(prefix);

// Render the real second-column cell and footer for each row so the countdown, section rules and the
// "Show more" wiring are exercised through FeatureGatesView rather than stubbed away. Only the Activated
// table carries `sort`.
vi.mock('../FeatureGateTable', () => ({
    EmptyStateCard: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    FeatureGateTable: ({ features, secondColumn, footer }: TableProps) => (
        <div>
            {secondColumn.sort ? <button onClick={secondColumn.sort.onToggle}>sort</button> : null}
            {features.map((feature, index) => (
                <div key={index} data-testid="feature-row">
                    {secondColumn.render(feature)}
                </div>
            ))}
            {footer}
        </div>
    ),
    OtherActivationsCell: () => null,
    ShowMoreButton: ({ hiddenCount, onClick }: { hiddenCount: number; onClick: () => void }) => (
        <button onClick={onClick}>Show {hiddenCount} more</button>
    ),
}));

const withActivated = () =>
    partitionFeatures.mockReturnValue({ activated: [{ clusterActivationEpoch: 10 }], upcoming: [] } as ReturnType<
        typeof partitionFeatures
    >);

const withUpcoming = (count: number) =>
    partitionFeatures.mockReturnValue({
        activated: [],
        upcoming: Array.from({ length: count }, (_, index) => ({ key: `feature-${index}`, otherActivations: [] })),
    } as unknown as ReturnType<typeof partitionFeatures>);

// A clusterInfo complete enough for FeatureGatesView to build a countdownInput.
const CLUSTER_INFO = {
    epochInfo: { epoch: 10n, slotIndex: 0n, slotsInEpoch: 432_000n },
    epochSchedule: { slotsPerEpoch: 432_000n },
} as unknown as ReturnType<typeof useClusterInfo>;

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

    describe('sections', () => {
        it('should show only the Upcoming section when nothing is activated', () => {
            withUpcoming(2);
            render(<FeatureGatesView />);

            expect(screen.getByRole('heading', { level: 2, name: startsWith('Upcoming') })).toBeInTheDocument();
            expect(screen.queryByRole('heading', { level: 2, name: startsWith('Activated') })).not.toBeInTheDocument();
            expect(screen.queryByText('No feature gates on Mainnet Beta.')).not.toBeInTheDocument();
        });

        it('should show only the Activated section when nothing is upcoming', () => {
            withActivated();
            render(<FeatureGatesView />);

            expect(screen.getByRole('heading', { level: 2, name: startsWith('Activated') })).toBeInTheDocument();
            expect(screen.queryByRole('heading', { level: 2, name: startsWith('Upcoming') })).not.toBeInTheDocument();
        });

        it('should show the empty state when a cluster has no feature gates', () => {
            render(<FeatureGatesView />);

            expect(screen.getByText('No feature gates on Mainnet Beta.')).toBeInTheDocument();
        });

        it('should explain an empty Upcoming list on testnet', () => {
            vi.mocked(useCluster).mockReturnValue({ cluster: Cluster.Testnet } as ReturnType<typeof useCluster>);
            withActivated();
            render(<FeatureGatesView />);

            expect(
                screen.getByText('New features activate on testnet first, so this list is usually empty here.'),
            ).toBeInTheDocument();
        });
    });

    describe('upcoming show more', () => {
        it('should reveal the hidden upcoming rows when "Show more" is clicked', () => {
            withUpcoming(7);
            render(<FeatureGatesView />);

            expect(screen.getAllByTestId('feature-row')).toHaveLength(4);

            fireEvent.click(screen.getByRole('button', { name: 'Show 3 more' }));

            expect(screen.getAllByTestId('feature-row')).toHaveLength(7);
            expect(screen.queryByRole('button', { name: startsWith('Show') })).not.toBeInTheDocument();
        });

        it('should fold the upcoming list again after switching cluster', () => {
            withUpcoming(7);
            const { rerender } = render(<FeatureGatesView />);
            fireEvent.click(screen.getByRole('button', { name: 'Show 3 more' }));
            expect(screen.getAllByTestId('feature-row')).toHaveLength(7);

            vi.mocked(useCluster).mockReturnValue({ cluster: Cluster.Devnet } as ReturnType<typeof useCluster>);
            rerender(<FeatureGatesView />);

            expect(screen.getAllByTestId('feature-row')).toHaveLength(4);
        });
    });

    describe('activation countdown', () => {
        // The Activated list carries a countdown only for an activation epoch still ahead of the current one.
        const withFutureActivation = () =>
            partitionFeatures.mockReturnValue({
                activated: [{ clusterActivationEpoch: 20 }],
                upcoming: [],
            } as ReturnType<typeof partitionFeatures>);

        it('should show the time remaining when the epoch and slot time are known', () => {
            withFutureActivation();
            vi.mocked(useClusterInfo).mockReturnValue(CLUSTER_INFO);
            vi.mocked(useSlotTime).mockReturnValue(400);
            render(<FeatureGatesView />);

            expect(screen.getByText(startsWith('in ~'))).toBeInTheDocument();
        });

        it('should omit the countdown when the slot time is unknown', () => {
            withFutureActivation();
            vi.mocked(useClusterInfo).mockReturnValue(CLUSTER_INFO);
            vi.mocked(useSlotTime).mockReturnValue(undefined);
            render(<FeatureGatesView />);

            expect(screen.queryByText(startsWith('in ~'))).not.toBeInTheDocument();
        });
    });
});
