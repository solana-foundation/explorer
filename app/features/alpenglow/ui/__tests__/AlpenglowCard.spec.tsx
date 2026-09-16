import { render, screen } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type AlpenglowStatus } from '../../model/use-alpenglow-status';
import { AlpenglowCard } from '../AlpenglowCard';

const CERT = { blockId: 'HnvmbDUEbrmuj3mYAA1EKGGzpZRuFRgMRPwtsgGFadmn', slot: 460_012_345n };

const mocks = vi.hoisted(() => ({ useAlpenglowStatus: vi.fn() }));

vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: Cluster.MainnetBeta }) }));
vi.mock('../../model/use-alpenglow-status', () => ({ useAlpenglowStatus: mocks.useAlpenglowStatus }));
vi.mock('@utils/url', () => ({ useClusterPath: ({ pathname }: { pathname: string }) => pathname }));

function renderWith(status: AlpenglowStatus) {
    mocks.useAlpenglowStatus.mockReturnValue(status);
    return render(<AlpenglowCard />);
}

describe('AlpenglowCard', () => {
    beforeEach(() => vi.clearAllMocks());

    // An endpoint without the method never delivers a card, so a placeholder would mislead.
    it.each([
        ['the answer is outstanding', { kind: 'loading' } as const],
        ['the endpoint cannot answer', { kind: 'unavailable' } as const],
    ])('should render nothing while %s', (_label, status) => {
        const { container } = renderWith(status);

        expect(container).toBeEmptyDOMElement();
    });

    it('should name the cluster and the consensus in force', () => {
        renderWith({ kind: 'pending' });

        // Substring match: the title carries a leading icon in its own element.
        expect(screen.getByText('Alpenglow on Mainnet Beta', { exact: false })).toBeInTheDocument();
        expect(screen.getByText('TowerBFT — Alpenglow not activated')).toBeInTheDocument();
    });

    it('should link the genesis slot to its block once the cluster has migrated', () => {
        renderWith({ cert: CERT, kind: 'migrated' });

        expect(screen.getByRole('link', { name: '460,012,345' })).toHaveAttribute('href', '/block/460012345');
        expect(screen.getByText(CERT.blockId)).toBeInTheDocument();
    });
});
