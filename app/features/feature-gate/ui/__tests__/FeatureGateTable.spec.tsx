import { address } from '@solana/kit';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Cluster, clusterSlug } from '@/app/utils/cluster';

import type { ActivatedFeature } from '../../lib/partition-features';
import { EmptyStateCard, FeatureGateTable, ShowMoreButton } from '../FeatureGateTable';

vi.mock('next/navigation', () => ({
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));

const FEATURE: ActivatedFeature = {
    clusterActivationEpoch: 727,
    comms_required: null,
    description: 'Two new instructions for moving value between stake accounts',
    devnet_activation_epoch: 798,
    key: address('7bTK6Jis8Xpfrs8ZoUfiMDPazTcdPcTWheZFJTA5Z6X4'),
    mainnet_activation_epoch: 727,
    min_agave_versions: [],
    min_fd_versions: [],
    min_jito_versions: [],
    otherActivations: [],
    owners: [],
    planned_testnet_order: null,
    simdEntries: [{ link: 'https://github.com/solana-foundation/solana-improvement-documents/pull/148', simd: '148' }],
    testnet_activation_epoch: 712,
    title: 'MoveStake and MoveLamports',
};

const renderTable = (props: Partial<Parameters<typeof FeatureGateTable<ActivatedFeature>>[0]> = {}) =>
    render(
        <FeatureGateTable<ActivatedFeature>
            features={[FEATURE]}
            cluster={Cluster.MainnetBeta}
            secondColumn={{ header: 'Activation', render: feature => feature.clusterActivationEpoch }}
            emptyState={<EmptyStateCard>Nothing here.</EmptyStateCard>}
            {...props}
        />,
    );

describe('FeatureGateTable', () => {
    it('should render a header row and a row per feature', () => {
        renderTable();

        expect(screen.getAllByRole('columnheader').map(cell => cell.textContent)).toEqual([
            'Feature',
            'Activation',
            'SIMDs',
            'Key',
        ]);
        expect(screen.getByRole('link', { name: 'MoveStake and MoveLamports' })).toHaveAttribute(
            'href',
            `/address/${FEATURE.key}/feature-gate?cluster=mainnet-beta`,
        );
    });

    it('should shorten the key and keep the full one in the link', () => {
        renderTable();

        const key = screen.getByRole('link', { name: `Open address ${FEATURE.key}` });
        expect(key).toHaveTextContent('7bTK…Z6X4');
        expect(key).toHaveAttribute('title', FEATURE.key);
    });

    it('should carry every value in the row itself, for the mobile card', () => {
        renderTable();

        const [, row] = screen.getAllByRole('row');
        expect(within(row).getByText(FEATURE.description as string)).toBeInTheDocument();
        expect(within(row).getByRole('cell', { name: '727' })).toBeInTheDocument();
        expect(within(row).getByRole('link', { name: 'SIMD 0148' })).toBeInTheDocument();
        expect(within(row).getByRole('link', { name: `Open address ${FEATURE.key}` })).toBeInTheDocument();
        expect(within(row).queryByText('Key')).not.toBeInTheDocument();
    });

    it('should show the description under the title, with nothing to open', () => {
        renderTable();

        expect(
            screen.getByRole('cell', { name: `MoveStake and MoveLamports ${FEATURE.description}` }),
        ).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Show details' })).not.toBeInTheDocument();
    });

    it('should turn a sortable header into a toggle that reports its direction', () => {
        const onToggle = vi.fn();
        renderTable({
            secondColumn: {
                header: 'Activation',
                render: feature => feature.clusterActivationEpoch,
                sort: { direction: 'desc', onToggle },
            },
        });

        const header = screen.getByRole('columnheader', { name: 'Activation' });
        expect(header).toHaveAttribute('aria-sort', 'descending');

        fireEvent.click(within(header).getByRole('button', { name: 'Activation' }));
        expect(onToggle).toHaveBeenCalledOnce();
    });

    it('should render the footer below the rows', () => {
        renderTable({ footer: <ShowMoreButton hiddenCount={3} onClick={vi.fn()} /> });

        expect(screen.getByRole('button', { name: 'Show 3 more' })).toBeInTheDocument();
    });

    it('should render the empty state instead of the table when there are no features', () => {
        renderTable({ features: [] });

        expect(screen.queryByRole('table')).not.toBeInTheDocument();
        expect(screen.getByText('Nothing here.')).toBeInTheDocument();
    });

    it('should link a mobile card to the feature page, its description shown', () => {
        renderTable();
        expect(screen.getByText(FEATURE.description as string)).not.toHaveClass('hidden');
        expect(screen.getByRole('link', { name: 'MoveStake and MoveLamports' })).toHaveAttribute(
            'href',
            `/address/${FEATURE.key}/feature-gate?cluster=${clusterSlug(Cluster.MainnetBeta)}`,
        );
    });
});
