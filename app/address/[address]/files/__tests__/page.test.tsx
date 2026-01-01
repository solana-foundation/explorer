import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import MetaplexFilesPage from '../page';

// Mock the page-client component
vi.mock('../page-client', () => ({
    default: ({ params }: { params: { address: string } }) => (
        <div data-testid="metaplex-files-page-client">Metaplex Files for address: {params.address}</div>
    ),
}));

describe('MetaplexFilesPage', () => {
    it('renders the page with correct props', () => {
        const props = {
            params: {
                address: 'DemoKeypair1111111111111111111111111111111111',
            },
        };

        render(<MetaplexFilesPage {...props} />);

        expect(screen.getByTestId('metaplex-files-page-client')).toBeInTheDocument();
        expect(
            screen.getByText('Metaplex Files for address: DemoKeypair1111111111111111111111111111111111')
        ).toBeInTheDocument();
    });

    it('passes address parameter correctly', () => {
        const testAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
        const props = {
            params: {
                address: testAddress,
            },
        };

        render(<MetaplexFilesPage {...props} />);

        expect(screen.getByText(`Metaplex Files for address: ${testAddress}`)).toBeInTheDocument();
    });
});
