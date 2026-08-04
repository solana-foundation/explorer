import { PublicKey } from '@solana/web3.js';
import { render, screen, waitFor } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const FILTER_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(() => '/address/x/tokens'),
    // Selected filter = FILTER_MINT so the toggle button renders that mint's label (the exact regression surface).
    useSearchParams: vi.fn(() => ({
        get: vi.fn((k: string) => (k === 'filter' ? FILTER_MINT : null)),
        has: vi.fn(),
        toString: () => `filter=${FILTER_MINT}`,
    })),
}));

const { useClusterMock } = vi.hoisted(() => ({ useClusterMock: vi.fn() }));
vi.mock('@providers/cluster', async importOriginal => {
    const actual = await importOriginal<typeof import('@providers/cluster')>();
    return { ...actual, useCluster: useClusterMock };
});

// Mock the shared per-mint hook so the dropdown resolves labels through the same path the holdings rows use.
const { useTokenInfoMock } = vi.hoisted(() => ({ useTokenInfoMock: vi.fn() }));
vi.mock('@entities/token-info', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/token-info')>();
    return { ...actual, useTokenInfo: useTokenInfoMock };
});

import { FilterDropdown } from '../TokenHistoryCard';

function tokenFor(mint: string) {
    return {
        info: {
            mint: new PublicKey(mint),
            tokenAmount: { amount: '1', decimals: 0, uiAmountString: '1' },
        },
        pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    };
}

describe('should label the Token History filter with fetched token metadata', () => {
    afterEach(() => vi.clearAllMocks());

    it('should show the fetched symbol and name on the selected-filter toggle button', async () => {
        useClusterMock.mockReturnValue({ cluster: Cluster.MainnetBeta, genesisHash: 'genesis' });
        useTokenInfoMock.mockReturnValue({
            address: FILTER_MINT,
            decimals: 6,
            logoURI: '',
            name: 'USD Coin',
            symbol: 'USDC',
            verified: true,
        });

        render(<FilterDropdown filter={FILTER_MINT} tokens={[tokenFor(FILTER_MINT)] as any} />);

        await waitFor(() => expect(screen.getByRole('button').textContent).toContain('USDC - USD Coin'));
    });

    it('should fall back to a truncated pubkey when metadata is unavailable', async () => {
        useClusterMock.mockReturnValue({ cluster: Cluster.MainnetBeta, genesisHash: 'genesis' });
        useTokenInfoMock.mockReturnValue(undefined);

        render(<FilterDropdown filter={FILTER_MINT} tokens={[tokenFor(FILTER_MINT)] as any} />);

        // 10-char prefix + ellipsis, matching TRUNCATE_TOKEN_LENGTH.
        await waitFor(() => expect(screen.getByRole('button').textContent).toContain(`${FILTER_MINT.slice(0, 10)}…`));
    });
});
