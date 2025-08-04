import { PublicKey } from '@solana/web3.js';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { MetaplexFilesCard } from '../MetaplexFilesCard';

// Mock the dependencies
vi.mock('@/app/providers/cluster', () => ({
    useCluster: () => ({
        url: 'https://api.mainnet-beta.solana.com',
    }),
}));

vi.mock('@/app/providers/compressed-nft', () => ({
    useCompressedNft: vi.fn(),
}));

vi.mock('@/app/features/metadata/utils', () => ({
    getProxiedUri: (uri: string) => uri,
}));

vi.mock('@components/common/ErrorCard', () => ({
    ErrorCard: ({ text }: { text: string }) => <div data-testid="error-card">{text}</div>,
}));

vi.mock('@components/common/LoadingCard', () => ({
    LoadingCard: () => <div data-testid="loading-card">Loading...</div>,
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import the mocked function
const { useCompressedNft } = await import('@/app/providers/compressed-nft');
const mockUseCompressedNft = vi.mocked(useCompressedNft);

describe('MetaplexFilesCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseCompressedNft.mockReturnValue(null);
    });

    const createMockAccount = (overrides = {}) =>
        ({
            data: {
                parsed: {
                    nftData: {
                        editionInfo: { edition: 'master', masterEdition: undefined },
                        json: undefined,
                        metadata: {
                            collection: null,
                            data: {
                                creators: null,
                                name: 'Test NFT',
                                sellerFeeBasisPoints: 0,
                                symbol: 'TEST',
                                uri: 'https://example.com/metadata.json',
                            },
                            editionNonce: null,
                            isMutable: true,
                            key: 1,
                            mint: 'So11111111111111111111111111111111111111112',
                            primarySaleHappened: false,
                            tokenStandard: null,
                            updateAuthority: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                            uses: null,
                        },
                    },
                    parsed: { type: 'mint' as const },
                    program: 'spl-token' as const,
                },
            },
            executable: false,
            lamports: 0,
            owner: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            pubkey: new PublicKey('So11111111111111111111111111111111111111112'),
            ...overrides,
        } as any);

    const mockOnNotFound = vi.fn(() => {
        throw new Error('Not found');
    });

    it('shows loading card initially', () => {
        const mockAccount = createMockAccount();
        render(<MetaplexFilesCard account={mockAccount} onNotFound={mockOnNotFound} />);

        expect(screen.getByTestId('loading-card')).toBeInTheDocument();
    });

    it('renders files table when fetch is successful', async () => {
        const mockFiles = [
            { type: 'image/png', uri: 'https://example.com/file1.png' },
            { type: 'image/jpeg', uri: 'https://example.com/file2.jpg' },
        ];

        mockFetch.mockResolvedValueOnce({
            json: () =>
                Promise.resolve({
                    properties: {
                        files: mockFiles,
                    },
                }),
        });

        const mockAccount = createMockAccount();
        render(<MetaplexFilesCard account={mockAccount} onNotFound={mockOnNotFound} />);

        await waitFor(() => {
            expect(screen.getByText('Files')).toBeInTheDocument();
        });

        expect(screen.getByText('File URI')).toBeInTheDocument();
        expect(screen.getByText('File Type')).toBeInTheDocument();

        // Check if files are rendered
        expect(screen.getByText('https://example.com/file1.png')).toBeInTheDocument();
        expect(screen.getByText('image/png')).toBeInTheDocument();
        expect(screen.getByText('https://example.com/file2.jpg')).toBeInTheDocument();
        expect(screen.getByText('image/jpeg')).toBeInTheDocument();
    });

    it('shows error card when fetch fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const mockAccount = createMockAccount();
        render(<MetaplexFilesCard account={mockAccount} onNotFound={mockOnNotFound} />);

        await waitFor(() => {
            expect(screen.getByTestId('error-card')).toBeInTheDocument();
        });

        expect(screen.getByText('Failed to fetch files')).toBeInTheDocument();
    });

    it('shows error when files property is not an array', async () => {
        mockFetch.mockResolvedValueOnce({
            json: () =>
                Promise.resolve({
                    properties: {
                        files: 'not an array',
                    },
                }),
        });

        const mockAccount = createMockAccount();
        render(<MetaplexFilesCard account={mockAccount} onNotFound={mockOnNotFound} />);

        await waitFor(() => {
            expect(screen.getByTestId('error-card')).toBeInTheDocument();
        });

        expect(screen.getByText('Failed to fetch files')).toBeInTheDocument();
    });

    it('filters out invalid file objects', async () => {
        const mockFiles = [
            { type: 'image/png', uri: 'https://example.com/valid.png' },
            { type: null, uri: 'invalid' }, // invalid type
            { type: 'image/jpeg', uri: null }, // invalid uri
            'not an object', // not an object
            { type: 'image/jpeg', uri: 'https://example.com/valid2.jpg' },
        ];

        mockFetch.mockResolvedValueOnce({
            json: () =>
                Promise.resolve({
                    properties: {
                        files: mockFiles,
                    },
                }),
        });

        const mockAccount = createMockAccount();
        render(<MetaplexFilesCard account={mockAccount} onNotFound={mockOnNotFound} />);

        await waitFor(() => {
            expect(screen.getByText('Files')).toBeInTheDocument();
        });

        // Should only show valid files
        expect(screen.getByText('https://example.com/valid.png')).toBeInTheDocument();
        expect(screen.getByText('https://example.com/valid2.jpg')).toBeInTheDocument();

        // Should not show invalid files
        expect(screen.queryByText('invalid')).not.toBeInTheDocument();
    });

    it('calls onNotFound when account data is invalid', () => {
        const invalidAccount = createMockAccount({
            data: {
                parsed: {
                    parsed: { type: 'account' },
                    program: 'spl-token',
                },
            },
        });

        expect(() => {
            render(<MetaplexFilesCard account={invalidAccount} onNotFound={mockOnNotFound} />);
        }).toThrow('Not found');

        expect(mockOnNotFound).toHaveBeenCalled();
    });

    it('calls onNotFound when account is undefined', () => {
        expect(() => {
            render(<MetaplexFilesCard account={undefined} onNotFound={mockOnNotFound} />);
        }).toThrow('Not found');

        expect(mockOnNotFound).toHaveBeenCalled();
    });

    it('renders file links with correct href and attributes', async () => {
        const mockFiles = [{ type: 'image/png', uri: 'https://example.com/file1.png' }];

        mockFetch.mockResolvedValueOnce({
            json: () =>
                Promise.resolve({
                    properties: {
                        files: mockFiles,
                    },
                }),
        });

        const mockAccount = createMockAccount();
        render(<MetaplexFilesCard account={mockAccount} onNotFound={mockOnNotFound} />);

        await waitFor(() => {
            expect(screen.getByText('Files')).toBeInTheDocument();
        });

        const fileLink = screen.getByRole('link', { name: 'https://example.com/file1.png' });
        expect(fileLink).toHaveAttribute('href', 'https://example.com/file1.png');
        expect(fileLink).toHaveAttribute('target', '_blank');
        expect(fileLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('handles compressed NFT when regular NFT data is not available', () => {
        mockUseCompressedNft.mockReturnValue({
            compression: {
                asset_hash: 'hash3',
                compressed: true,
                creator_hash: 'hash2',
                data_hash: 'hash1',
                eligible: false,
                leaf_id: 1,
                seq: 1,
                tree: 'tree1',
            },
            content: {
                $schema: 'schema',
                files: [],
                json_uri: 'https://compressed-nft.com/metadata.json',
                links: {},
                metadata: {
                    attributes: [],
                    description: 'desc',
                    name: 'name',
                    symbol: 'symbol',
                    token_standard: 'standard',
                },
            },
        } as any);

        const accountWithoutNftData = createMockAccount({
            data: {
                parsed: {
                    parsed: { type: 'account' },
                    program: 'spl-token',
                },
            },
        });

        render(<MetaplexFilesCard account={accountWithoutNftData} onNotFound={mockOnNotFound} />);

        expect(screen.getByTestId('loading-card')).toBeInTheDocument();
    });

    it('handles empty files array', async () => {
        mockFetch.mockResolvedValueOnce({
            json: () =>
                Promise.resolve({
                    properties: {
                        files: [],
                    },
                }),
        });

        const mockAccount = createMockAccount();
        render(<MetaplexFilesCard account={mockAccount} onNotFound={mockOnNotFound} />);

        await waitFor(() => {
            expect(screen.getByText('Files')).toBeInTheDocument();
        });

        expect(screen.getByText('File URI')).toBeInTheDocument();
        expect(screen.getByText('File Type')).toBeInTheDocument();

        // Should show table with no file rows (only header row)
        const fileRows = screen.getAllByRole('row');
        expect(fileRows).toHaveLength(1); // Only header row
    });

    it('uses proxied URI for metadata fetch', async () => {
        const mockFiles = [{ type: 'image/png', uri: 'https://example.com/file1.png' }];

        mockFetch.mockResolvedValueOnce({
            json: () =>
                Promise.resolve({
                    properties: {
                        files: mockFiles,
                    },
                }),
        });

        const mockAccount = createMockAccount();
        render(<MetaplexFilesCard account={mockAccount} onNotFound={mockOnNotFound} />);

        await waitFor(() => {
            expect(screen.getByText('Files')).toBeInTheDocument();
        });

        // Verify that fetch was called with the metadata URI
        expect(mockFetch).toHaveBeenCalledWith('https://example.com/metadata.json');
    });

    it('handles missing properties in metadata', async () => {
        mockFetch.mockResolvedValueOnce({
            json: () =>
                Promise.resolve({
                    // Missing properties field
                }),
        });

        const mockAccount = createMockAccount();
        render(<MetaplexFilesCard account={mockAccount} onNotFound={mockOnNotFound} />);

        await waitFor(() => {
            expect(screen.getByTestId('error-card')).toBeInTheDocument();
        });

        expect(screen.getByText('Failed to fetch files')).toBeInTheDocument();
    });

    it('creates unique keys for file rows', async () => {
        const mockFiles = [
            { type: 'image/png', uri: 'https://example.com/file1.png' },
            { type: 'image/png', uri: 'https://example.com/file2.png' },
            { type: 'image/jpeg', uri: 'https://example.com/file1.png' }, // Same URI, different type
        ];

        mockFetch.mockResolvedValueOnce({
            json: () =>
                Promise.resolve({
                    properties: {
                        files: mockFiles,
                    },
                }),
        });

        const mockAccount = createMockAccount();
        render(<MetaplexFilesCard account={mockAccount} onNotFound={mockOnNotFound} />);

        await waitFor(() => {
            expect(screen.getByText('Files')).toBeInTheDocument();
        });

        // Should render all files with unique keys
        const fileRows = screen.getAllByRole('row').slice(1); // Skip header row
        expect(fileRows).toHaveLength(3);
    });
});
