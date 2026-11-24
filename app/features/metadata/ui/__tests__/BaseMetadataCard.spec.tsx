import { fireEvent, render, screen } from '@testing-library/react';

import { BaseMetadataCard, type MetadataSection } from '../BaseMetadataCard';

const tokenExtension: MetadataSection = {
    data: { name: 'PayPal USD' },
    id: 'token-metadata',
    title: 'Token extension',
};
const metaplex: MetadataSection = { data: { name: 'USD Coin' }, id: 'metaplex-metadata', title: 'Metaplex' };

describe('BaseMetadataCard', () => {
    it('should label a single source in the card header', () => {
        render(<BaseMetadataCard sections={[tokenExtension]} />);

        expect(screen.getByRole('heading', { name: 'Metadata' })).toBeInTheDocument();
        expect(screen.getByText('Token extension')).toBeInTheDocument();
        expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
        // One whole-block copy button, in the card's header; the tree drops its own.
        expect(screen.getAllByRole('button', { name: 'Copy JSON' })).toHaveLength(1);
    });

    it('should switch several sources with tabs in one Metadata section', () => {
        render(<BaseMetadataCard sections={[tokenExtension, metaplex]} />);

        expect(screen.getAllByRole('heading')).toHaveLength(1);
        expect(screen.getByText('PayPal USD')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('tab', { name: 'Metaplex' }));

        expect(screen.getByRole('tab', { name: 'Metaplex' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText('USD Coin')).toBeInTheDocument();
        expect(screen.queryByText('PayPal USD')).not.toBeInTheDocument();
    });

    it('should report a missing source', () => {
        render(<BaseMetadataCard sections={[]} />);

        expect(screen.getByText('No metadata found')).toBeInTheDocument();
    });
});
