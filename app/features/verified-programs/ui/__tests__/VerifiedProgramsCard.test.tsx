import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { fetchProgramsPage } from '../../api';
import type { VerifiedProgramInfo } from '../../types';
import { VerifiedProgramsCard } from '../VerifiedProgramsCard';

vi.mock('@react-hook/debounce', () => ({
    useDebounceCallback: vi.fn((callback: any) => callback),
}));

vi.mock('@utils/url', () => ({
    useClusterPath: vi.fn(({ pathname }: { pathname: string }) => pathname),
}));

vi.mock('../../api', () => ({
    fetchProgramsPage: vi.fn(),
}));

vi.mock('../../model', () => ({
    isValidGitHubUrl: vi.fn((url: string) => url.startsWith('https://github.com')),
}));

vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock('@components/common/LoadingCard', () => ({
    LoadingCard: ({ message }: { message?: string }) => <div data-testid="loading-card">{message || 'Loading'}</div>,
}));

vi.mock('@components/common/ErrorCard', () => ({
    ErrorCard: ({ text }: { text: string }) => <div data-testid="error-card">{text}</div>,
}));

vi.mock('@components/common/TableCardBody', () => ({
    TableCardBodyHeaded: ({
        children,
        headerComponent,
    }: {
        children: React.ReactNode;
        headerComponent?: React.ReactNode;
    }) => (
        <div data-testid="table-card">
            <table>
                <thead>{headerComponent}</thead>
                <tbody>{children}</tbody>
            </table>
        </div>
    ),
}));

describe('VerifiedProgramsCard', () => {
    const mockPrograms: VerifiedProgramInfo[] = [
        {
            isVerified: true as const,
            lastVerifiedAt: '2024-11-20T18:11:17.727030',
            name: 'Phoenix V1',
            programId: 'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY',
            repoUrl: 'https://github.com/Ellipsis-Labs/phoenix-v1',
        },
        {
            isVerified: true as const,
            lastVerifiedAt: '2024-11-20T18:11:17.727030',
            name: 'Solana Program Library',
            programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            repoUrl: 'https://github.com/solana-labs/solana-program-library',
        },
        {
            isVerified: true as const,
            lastVerifiedAt: '2024-11-20T18:11:17.727030',
            name: 'Token 2022',
            programId: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
            repoUrl: 'https://github.com/solana-labs/token-2022',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock implementation returns first page with all programs
        vi.mocked(fetchProgramsPage).mockResolvedValue({
            currentPage: 1,
            programs: mockPrograms,
            totalCount: mockPrograms.length,
            totalPages: 1,
        });
    });

    it('renders loading state initially', () => {
        // Mock a slow fetch that never resolves
        vi.mocked(fetchProgramsPage).mockImplementation(
            () =>
                new Promise(() => {
                    // Never resolves
                })
        );

        render(<VerifiedProgramsCard />);

        expect(screen.getByTestId('loading-card')).toBeInTheDocument();
        expect(screen.getByText('Loading verified programs...')).toBeInTheDocument();
    });

    it('renders error state', async () => {
        vi.mocked(fetchProgramsPage).mockRejectedValue(new Error('Failed to fetch'));

        render(<VerifiedProgramsCard />);

        await waitFor(() => {
            expect(screen.getByTestId('error-card')).toBeInTheDocument();
        });
        expect(screen.getByText('Failed to load verified programs.')).toBeInTheDocument();
    });

    it('renders programs list', async () => {
        render(<VerifiedProgramsCard />);

        await waitFor(() => {
            expect(screen.getByText('Verified Programs')).toBeInTheDocument();
        });

        expect(screen.getByText('3 of 3 verified programs from')).toBeInTheDocument();

        expect(screen.getByText('Solana Program Library')).toBeInTheDocument();
        expect(screen.getByText('Token 2022')).toBeInTheDocument();
        expect(screen.getByText('Phoenix V1')).toBeInTheDocument();
    });

    it('renders status badges for all programs', async () => {
        render(<VerifiedProgramsCard />);

        await waitFor(() => {
            const badges = screen.getAllByText('Verified');
            expect(badges).toHaveLength(3);
        });
    });

    it('renders search input', async () => {
        render(<VerifiedProgramsCard />);

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Search programs by name or address...')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Search programs by name or address...');
        expect(searchInput).toHaveAttribute('aria-label', 'Search programs by name or address');
    });

    it('filters programs by search query (name)', async () => {
        const user = userEvent.setup();
        render(<VerifiedProgramsCard />);

        await waitFor(() => {
            expect(screen.getByText('Phoenix V1')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Search programs by name or address...');
        await user.type(searchInput, 'Phoenix');

        await waitFor(() => {
            expect(screen.queryByText('Solana Program Library')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Phoenix V1')).toBeInTheDocument();
        expect(screen.queryByText('Token 2022')).not.toBeInTheDocument();
    });

    it('shows no results message when search has no matches', async () => {
        const user = userEvent.setup();
        render(<VerifiedProgramsCard />);

        await waitFor(() => {
            expect(screen.getByText('Phoenix V1')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Search programs by name or address...');
        await user.type(searchInput, 'NonExistentProgram');

        await waitFor(() => {
            expect(screen.getByText('No programs match your search.')).toBeInTheDocument();
        });
    });

    it('renders table headers including Source Code column', async () => {
        render(<VerifiedProgramsCard />);

        await waitFor(() => {
            expect(screen.getByText('Name')).toBeInTheDocument();
        });

        expect(screen.getByText('Address')).toBeInTheDocument();
        expect(screen.getByText('Source Code')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders copyable addresses with correct program IDs', async () => {
        render(<VerifiedProgramsCard />);

        await waitFor(() => {
            expect(screen.getByText('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')).toBeInTheDocument();
        });

        expect(screen.getByText('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')).toBeInTheDocument();
        expect(screen.getByText('PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY')).toBeInTheDocument();
    });

    it('renders GitHub links for programs with repos', async () => {
        render(<VerifiedProgramsCard />);

        await waitFor(() => {
            expect(screen.getAllByText('GitHub →')).toHaveLength(3);
        });

        const githubLinks = screen.getAllByText('GitHub →');
        const link = githubLinks[0];
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('shows Load More button and loads additional pages', async () => {
        const user = userEvent.setup();

        vi.mocked(fetchProgramsPage).mockResolvedValueOnce({
            currentPage: 1,
            programs: [mockPrograms[0]],
            totalCount: 3,
            totalPages: 2,
        });

        render(<VerifiedProgramsCard />);

        await waitFor(() => {
            expect(screen.getByText('Phoenix V1')).toBeInTheDocument();
        });

        expect(screen.getByText('1 of 3 verified programs from')).toBeInTheDocument();
        expect(screen.getByText('Load More')).toBeInTheDocument();

        // Use a promise we can control to ensure loading state is visible
        let resolveLoadMore: (value: any) => void;
        const loadMorePromise = new Promise(resolve => {
            resolveLoadMore = resolve;
        });

        vi.mocked(fetchProgramsPage).mockReturnValueOnce(loadMorePromise as any);

        await user.click(screen.getByText('Load More'));

        await waitFor(() => {
            expect(screen.getByText('Loading')).toBeInTheDocument();
        });

        // Now resolve the promise
        resolveLoadMore!({
            currentPage: 2,
            programs: [mockPrograms[1], mockPrograms[2]],
            totalCount: 3,
            totalPages: 2,
        });

        await waitFor(() => {
            expect(screen.getByText('Solana Program Library')).toBeInTheDocument();
        });

        expect(screen.getByText('Token 2022')).toBeInTheDocument();
        expect(screen.getByText('3 of 3 verified programs from')).toBeInTheDocument();
        expect(screen.getByText('All programs loaded')).toBeInTheDocument();
        expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });
});
