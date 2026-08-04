import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// next/navigation is used by OwnedTokensCard's display dropdown, which selects the summary vs detail body.
const { useSearchParamsMock } = vi.hoisted(() => ({ useSearchParamsMock: vi.fn() }));
vi.mock('next/navigation', () => ({
    usePathname: vi.fn(() => '/address/x/tokens'),
    useSearchParams: useSearchParamsMock,
}));

function searchParams(display: string | null) {
    return { get: vi.fn(() => display), has: vi.fn(), toString: () => '' };
}

const { useAccountOwnedTokensMock, useFetchAccountOwnedTokensMock } = vi.hoisted(() => ({
    useAccountOwnedTokensMock: vi.fn(),
    useFetchAccountOwnedTokensMock: vi.fn(() => vi.fn()),
}));
vi.mock('@providers/accounts/tokens', () => ({
    useAccountOwnedTokens: useAccountOwnedTokensMock,
    useFetchAccountOwnedTokens: useFetchAccountOwnedTokensMock,
}));

const { useClusterMock } = vi.hoisted(() => ({ useClusterMock: vi.fn() }));
vi.mock('@providers/cluster', async importOriginal => {
    const actual = await importOriginal<typeof import('@providers/cluster')>();
    return { ...actual, useCluster: useClusterMock };
});

// Keep the real deriveScaledUiAmountMultiplier, override only useTokenInfo so rows enrich from the batch path.
const { useTokenInfoMock } = vi.hoisted(() => ({ useTokenInfoMock: vi.fn() }));
vi.mock('@entities/token-info', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/token-info')>();
    return { ...actual, useTokenInfo: useTokenInfoMock };
});

// Stub Address so we can assert props without dragging in nickname/visibility/cluster-path machinery.
vi.mock('@components/common/Address', () => ({
    Address: ({ pubkey, fetchTokenLabelInfo, tokenLabelInfo }: any) => (
        <span
            data-testid="address"
            data-fetch-label={String(Boolean(fetchTokenLabelInfo))}
            data-has-token-label-info={String(tokenLabelInfo !== undefined)}
        >
            {pubkey.toBase58()}
        </span>
    ),
}));

// Stub ProxiedImage to echo the uri (or its absence) so we can assert the logo column and fallback branch.
vi.mock('@/app/features/metadata', () => ({
    ProxiedImage: ({ uri, alt }: any) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img data-testid="token-logo" data-uri={uri ?? ''} alt={alt} />
    ),
}));

// Stub the tooltip to echo its props - Radix only mounts content on hover, and the values are what we assert on.
vi.mock('@components/account/token-extensions/ScaledUiAmountMultiplierTooltip', () => ({
    default: ({ rawAmount, scaledUiAmountMultiplier }: any) => (
        <span data-testid="scaled-tooltip" data-multiplier={scaledUiAmountMultiplier} data-raw-amount={rawAmount} />
    ),
}));

import { OwnedTokensCard } from '../OwnedTokensCard';

const OWNER = '11111111111111111111111111111111';
const MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const LOGO = 'https://example.test/usdc.png';
const TOKEN_ACCOUNT_A = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_ACCOUNT_B = 'SysvarC1ock11111111111111111111111111111111';

type TokenAmount = { amount: string; decimals: number; uiAmountString: string };

function makeTokenAccount(tokenAmount: TokenAmount, pubkey: string = TOKEN_ACCOUNT_A) {
    return { info: { mint: new PublicKey(MINT), tokenAmount }, pubkey: new PublicKey(pubkey) };
}

// One mint held in two accounts, each scaled by 2: the row totals 8, so the tooltip must show 4 pre-scaling.
function twoAccountsOfOneMint() {
    return makeEntryWith([
        makeTokenAccount({ amount: '1000000', decimals: 6, uiAmountString: '2' }, TOKEN_ACCOUNT_A),
        makeTokenAccount({ amount: '3000000', decimals: 6, uiAmountString: '6' }, TOKEN_ACCOUNT_B),
    ]);
}

function makeEntryWith(tokens: ReturnType<typeof makeTokenAccount>[]) {
    return { data: { tokens }, status: FetchStatus.Fetched };
}

function makeEntry() {
    return makeEntryWith([makeTokenAccount({ amount: '1234560000', decimals: 6, uiAmountString: '1234.56' })]);
}

describe('should render OwnedTokensCard with lazy per-row enrichment', () => {
    beforeEach(() => {
        useClusterMock.mockReturnValue({ cluster: Cluster.MainnetBeta, genesisHash: 'genesis', url: 'http://rpc' });
        useAccountOwnedTokensMock.mockReturnValue(makeEntry());
        useSearchParamsMock.mockReturnValue(searchParams(null));
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should render the symbol and logo from useTokenInfo and pass fetchTokenLabelInfo to the mint Address', () => {
        useTokenInfoMock.mockReturnValue({
            address: MINT,
            decimals: 6,
            logoURI: LOGO,
            name: 'USD Coin',
            symbol: 'USDC',
        });

        render(<OwnedTokensCard address={OWNER} />);

        // Logo column always rendered, with the fetched uri.
        const logo = screen.getByTestId('token-logo');
        expect(logo.getAttribute('data-uri')).toBe(LOGO);
        // The row drives the lazy fetch for its own mint via useTokenInfo (fetch=true, correct mint + cluster).
        expect(useTokenInfoMock).toHaveBeenCalledWith(true, MINT, Cluster.MainnetBeta, 'genesis');
        // Symbol comes from useTokenInfo, rendered next to the amount in the balance cell.
        expect(screen.getByText('USDC', { exact: false })).toBeInTheDocument();
        // Mint Address is labeled from the row's already-fetched tokenInfo (tokenLabelInfo), no second fetch.
        const address = screen.getByTestId('address');
        expect(address.getAttribute('data-fetch-label')).toBe('false');
        expect(address.getAttribute('data-has-token-label-info')).toBe('true');
    });

    it('should still render the logo column with a fallback when token info is unavailable', () => {
        useTokenInfoMock.mockReturnValue(undefined);

        render(<OwnedTokensCard address={OWNER} />);

        // The logo cell is present and the uri is empty, so ProxiedImage shows its Solana fallback.
        const logo = screen.getByTestId('token-logo');
        expect(logo.getAttribute('data-uri')).toBe('');
        // No symbol text when info is missing.
        expect(screen.queryByText('USDC')).not.toBeInTheDocument();
    });

    it('should render the pre-scaling raw amount without u64 precision loss', () => {
        useTokenInfoMock.mockReturnValue(undefined);
        // 2^53 + 1 base units: Number() rounds this to ...992, dropping the trailing 3 from the displayed amount.
        useAccountOwnedTokensMock.mockReturnValue(
            makeEntryWith([
                makeTokenAccount({ amount: '9007199254740993', decimals: 6, uiAmountString: '18014398509.481986' }),
            ]),
        );

        render(<OwnedTokensCard address={OWNER} />);

        const tooltip = screen.getByTestId('scaled-tooltip');
        expect(tooltip.getAttribute('data-multiplier')).toBe('2');
        expect(tooltip.getAttribute('data-raw-amount')).toBe('9007199254.740993');
    });

    it('should sum rawAmount across token accounts of the same mint in summary display', () => {
        useTokenInfoMock.mockReturnValue(undefined);
        useAccountOwnedTokensMock.mockReturnValue(twoAccountsOfOneMint());

        render(<OwnedTokensCard address={OWNER} />);

        expect(screen.getByText('8')).toBeInTheDocument();
        const tooltip = screen.getByTestId('scaled-tooltip');
        expect(tooltip.getAttribute('data-multiplier')).toBe('2');
        expect(tooltip.getAttribute('data-raw-amount')).toBe('4');
    });

    it('should sum rawAmount across token accounts of the same mint in detail display', () => {
        useTokenInfoMock.mockReturnValue(undefined);
        useSearchParamsMock.mockReturnValue(searchParams('detail'));
        useAccountOwnedTokensMock.mockReturnValue(twoAccountsOfOneMint());

        render(<OwnedTokensCard address={OWNER} />);

        expect(screen.getByText('8')).toBeInTheDocument();
        const tooltip = screen.getByTestId('scaled-tooltip');
        expect(tooltip.getAttribute('data-multiplier')).toBe('2');
        expect(tooltip.getAttribute('data-raw-amount')).toBe('4');
    });
});
