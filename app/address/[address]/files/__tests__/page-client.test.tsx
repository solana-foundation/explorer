import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import MetaplexFilesPageClient from '../page-client';

// Mock the dependencies
vi.mock('@/app/components/common/LoadingCard', () => ({
    LoadingCard: () => <div data-testid="loading-card">Loading...</div>,
}));

vi.mock('@components/account/ParsedAccountRenderer', () => ({
    ParsedAccountRenderer: ({
        address,
        renderComponent: RenderComponentProp,
    }: {
        address: string;
        renderComponent: React.ComponentType<any>;
    }) => {
        // Mock account data for testing
        const mockAccount = {
            data: {
                parsed: {
                    nftData: {
                        metadata: {
                            data: {
                                uri: 'https://example.com/metadata.json',
                            },
                        },
                    },
                    parsed: { type: 'mint' },
                    program: 'spl-token',
                },
            },
            pubkey: { toString: () => address },
        };
        const mockOnNotFound = vi.fn(() => {
            throw new Error('Not found');
        });

        return (
            <div data-testid="parsed-account-renderer">
                <RenderComponentProp account={mockAccount} onNotFound={mockOnNotFound} />
            </div>
        );
    },
}));

vi.mock('@components/account/MetaplexFilesCard', () => ({
    MetaplexFilesCard: ({ account, onNotFound: _onNotFound }: { account: any; onNotFound: () => never }) => (
        <div data-testid="metaplex-files-card">MetaplexFilesCard for {account?.pubkey?.toString()}</div>
    ),
}));

describe('MetaplexFilesPageClient', () => {
    it('renders ParsedAccountRenderer with correct address', () => {
        const testAddress = 'DemoKeypair1111111111111111111111111111111111';
        const props = {
            params: {
                address: testAddress,
            },
        };

        render(<MetaplexFilesPageClient {...props} />);

        expect(screen.getByTestId('parsed-account-renderer')).toBeInTheDocument();
    });

    it('renders MetaplexFilesCard within Suspense boundary', async () => {
        const testAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
        const props = {
            params: {
                address: testAddress,
            },
        };

        render(<MetaplexFilesPageClient {...props} />);

        await waitFor(() => {
            expect(screen.getByTestId('metaplex-files-card')).toBeInTheDocument();
        });
    });

    it('renders the correct component structure', () => {
        const testAddress = 'DemoKeypair1111111111111111111111111111111111';
        const props = {
            params: {
                address: testAddress,
            },
        };

        render(<MetaplexFilesPageClient {...props} />);

        // Should render the parsed account renderer with the component structure
        expect(screen.getByTestId('parsed-account-renderer')).toBeInTheDocument();
        expect(screen.getByTestId('metaplex-files-card')).toBeInTheDocument();
    });
});
