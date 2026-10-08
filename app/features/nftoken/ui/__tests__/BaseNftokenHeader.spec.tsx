import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BaseNftokenHeader } from '../BaseNftokenHeader';

vi.mock('@components/common/InfoTooltip', () => ({
    InfoTooltip: ({ text }: { text: string }) => <span>{text}</span>,
}));

describe('BaseNftokenHeader', () => {
    it('should render no heading while the metadata loads', () => {
        render(<BaseNftokenHeader kind="collection" metadata={{ kind: 'loading' }} mutable />);

        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it.each([
        ['nft', 'NFToken NFT'],
        ['collection', 'NFToken Collection'],
    ] as const)('should show the name from the metadata under the %s label', (kind, label) => {
        render(
            <BaseNftokenHeader
                kind={kind}
                metadata={{ kind: 'loaded', metadata: { image: undefined, name: 'Genesis: friends.glow' } }}
                mutable
            />,
        );

        expect(screen.getByRole('heading', { name: label })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Genesis: friends.glow' })).toBeInTheDocument();
    });

    it('should link the original image from the metadata', () => {
        const image = 'https://cdn.glow.app/g/5e/rwwih1nsp8.png';

        render(
            <BaseNftokenHeader
                kind="nft"
                metadata={{ kind: 'loaded', metadata: { image, name: 'Genesis: friends.glow' } }}
                mutable
            />,
        );

        expect(screen.getByRole('link', { name: 'View original' })).toHaveAttribute('href', image);
    });

    it.each([
        ['nft', 'No NFT name was found'],
        ['collection', 'No collection name was found'],
    ] as const)('should show the missing-name text for kind %s with unavailable metadata', (kind, text) => {
        render(<BaseNftokenHeader kind={kind} metadata={{ kind: 'unavailable' }} mutable />);

        expect(screen.getByRole('heading', { name: text })).toBeInTheDocument();
    });

    it.each(['nft', 'collection'] as const)('should report failed metadata for kind %s', kind => {
        render(<BaseNftokenHeader kind={kind} metadata={{ kind: 'failed' }} mutable />);

        expect(screen.getByRole('heading', { name: 'Failed to load metadata' })).toBeInTheDocument();
    });

    it.each([
        ['nft', true, 'Mutable', 'The authority of this NFT can update the Metadata.'],
        ['collection', true, 'Mutable', 'The authority of this Collection can update the Metadata and add NFTs.'],
        ['nft', false, 'Immutable', 'The Metadata cannot be updated by anyone.'],
        ['collection', false, 'Immutable', 'The Metadata cannot be updated by anyone.'],
    ] as const)('should show kind %s with mutable %s as %s with its tooltip text', (kind, mutable, badge, tooltip) => {
        render(<BaseNftokenHeader kind={kind} metadata={{ kind: 'unavailable' }} mutable={mutable} />);

        expect(screen.getByText(badge)).toBeInTheDocument();
        expect(screen.getByText(tooltip)).toBeInTheDocument();
    });
});
