import { gen } from '@__fixtures__/gen';
import type { TokenInfo } from '@entities/token-info';
import { tokenInfo } from '@entities/token-info/__fixtures__/token-info';
import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

// Only the lookups are stubbed. `orderMintsByVerification` and `deriveScaledUiAmountMultiplier`
// stay real, so these specs exercise the actual ordering rather than a re-statement of it.
const { useTokenInfoMock, useVerifiedTokenInfosMock } = vi.hoisted(() => ({
    useTokenInfoMock: vi.fn(),
    useVerifiedTokenInfosMock: vi.fn(),
}));
vi.mock('@entities/token-info', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/token-info')>()),
    useTokenInfo: useTokenInfoMock,
    useVerifiedTokenInfos: useVerifiedTokenInfosMock,
}));

// Stub Address so we can assert props without dragging in nickname/visibility/cluster-path machinery.
vi.mock('@components/common/Address', () => ({
    Address: ({ pubkey, tokenLabelInfo }: any) => (
        <span data-testid="address" data-has-token-label-info={String(tokenLabelInfo !== undefined)}>
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
const USDC: TokenInfo = {
    address: MINT,
    decimals: 6,
    logoURI: LOGO,
    name: 'USD Coin',
    symbol: 'USDC',
    verified: true,
};

type TokenAmount = { amount: string; decimals: number; uiAmountString: string };

/** One base unit at zero decimals, for specs that assert on order rather than on balances. */
const UNIT_AMOUNT: TokenAmount = { amount: '1', decimals: 0, uiAmountString: '1' };

function makeTokenAccount(tokenAmount: TokenAmount, pubkey: string = TOKEN_ACCOUNT_A, mint: string = MINT) {
    return { info: { mint: new PublicKey(mint), tokenAmount }, pubkey: new PublicKey(pubkey) };
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

function verified(...tokens: TokenInfo[]) {
    return { isLoading: false, tokenInfos: new Map(tokens.map(token => [token.address, token])) };
}

function listTokens(...tokens: TokenInfo[]) {
    useTokenInfoMock.mockImplementation(({ mint }: { mint: string }) => {
        const tokenInfo = tokens.find(token => token.address === mint);
        return tokenInfo
            ? { isLoading: false, kind: 'listed', tokenInfo }
            : { isLoading: false, kind: 'not-listed', tokenInfo: undefined };
    });
}

// GridTable renders the desktop grid (role="table") and a label-stacked mobile copy (also role="table")
// at once, so every value appears twice in jsdom. Scope row/content assertions to the desktop table,
// which renders first.
function grid() {
    return within(screen.getAllByRole('table')[0]);
}

/**
 * Mints in the order they are on screen. Summary display only — detail display renders an
 * account Address ahead of the mint on every row, so this would return both.
 */
function visibleMints() {
    return grid()
        .getAllByTestId('address')
        .map(node => node.textContent);
}

function lookedUpMints() {
    return new Set(useTokenInfoMock.mock.calls.map(([{ mint }]) => mint).filter(mint => mint !== undefined));
}

/** Undefined once every holding is on screen, since the footer renders nothing then. */
function loadMoreButton() {
    return screen.queryAllByRole('button').find(button => button.textContent?.startsWith('Load More'));
}

beforeEach(() => {
    useClusterMock.mockReturnValue({ cluster: Cluster.Mainnet, genesisHash: 'genesis', url: 'http://rpc' });
    useVerifiedTokenInfosMock.mockReturnValue(verified());
    listTokens();
});

describe('should render OwnedTokensCard', () => {
    beforeEach(() => {
        useAccountOwnedTokensMock.mockReturnValue(makeEntry());
        useSearchParamsMock.mockReturnValue(searchParams(null));
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should render a verified mint from the verified lookup, without a token info request of its own', () => {
        useVerifiedTokenInfosMock.mockReturnValue(verified(USDC));

        render(<OwnedTokensCard address={OWNER} />);

        expect(grid().getByTestId('token-logo').getAttribute('data-uri')).toBe(LOGO);
        expect(grid().getByText('USDC', { exact: false })).toBeInTheDocument();
        expect(lookedUpMints()).toEqual(new Set());
        expect(grid().getByTestId('address').getAttribute('data-has-token-label-info')).toBe('true');
    });

    it('should render an unverified mint from its own token info request', () => {
        listTokens({ ...USDC, verified: false });

        render(<OwnedTokensCard address={OWNER} />);

        expect(grid().getByTestId('token-logo').getAttribute('data-uri')).toBe(LOGO);
        expect(grid().getByText('USDC', { exact: false })).toBeInTheDocument();
        expect(useTokenInfoMock).toHaveBeenCalledWith({ cluster: Cluster.Mainnet, genesisHash: 'genesis', mint: MINT });
        expect(grid().getByTestId('address').getAttribute('data-has-token-label-info')).toBe('true');
    });

    it('should still render the logo column with a fallback when token info is unavailable', () => {
        render(<OwnedTokensCard address={OWNER} />);

        // The logo cell is present and the uri is empty, so ProxiedImage shows its Solana fallback.
        const logo = grid().getByTestId('token-logo');
        expect(logo.getAttribute('data-uri')).toBe('');
        // No symbol text when info is missing.
        expect(screen.queryByText('USDC')).not.toBeInTheDocument();
    });

    it('should hold the loading state until the verified lookup settles, rather than paint an unsorted list', () => {
        useVerifiedTokenInfosMock.mockReturnValue({ isLoading: true, tokenInfos: new Map() });

        render(<OwnedTokensCard address={OWNER} />);

        expect(screen.getByText('Loading token holdings')).toBeInTheDocument();
        expect(screen.queryAllByTestId('address')).toHaveLength(0);
    });

    it('should render the pre-scaling raw amount without u64 precision loss', () => {
        // 2^53 + 1 base units: Number() rounds this to ...992, dropping the trailing 3 from the displayed amount.
        useAccountOwnedTokensMock.mockReturnValue(
            makeEntryWith([
                makeTokenAccount({ amount: '9007199254740993', decimals: 6, uiAmountString: '18014398509.481986' }),
            ]),
        );

        render(<OwnedTokensCard address={OWNER} />);

        const tooltip = grid().getByTestId('scaled-tooltip');
        expect(tooltip.getAttribute('data-multiplier')).toBe('2');
        expect(tooltip.getAttribute('data-raw-amount')).toBe('9007199254.740993');
    });

    it('should sum rawAmount across token accounts of the same mint in summary display', () => {
        useAccountOwnedTokensMock.mockReturnValue(twoAccountsOfOneMint());

        render(<OwnedTokensCard address={OWNER} />);

        expect(grid().getByText('8')).toBeInTheDocument();
        const tooltip = grid().getByTestId('scaled-tooltip');
        expect(tooltip.getAttribute('data-multiplier')).toBe('2');
        expect(tooltip.getAttribute('data-raw-amount')).toBe('4');
    });

    it('should sum rawAmount across token accounts of the same mint in detail display', () => {
        useSearchParamsMock.mockReturnValue(searchParams('detail'));
        useAccountOwnedTokensMock.mockReturnValue(twoAccountsOfOneMint());

        render(<OwnedTokensCard address={OWNER} />);

        expect(grid().getByText('8')).toBeInTheDocument();
        const tooltip = grid().getByTestId('scaled-tooltip');
        expect(tooltip.getAttribute('data-multiplier')).toBe('2');
        expect(tooltip.getAttribute('data-raw-amount')).toBe('4');
    });
});

describe('should order holdings by verification', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should render the verified mints first, then the rest in RPC order', () => {
        const [first, second, third, fourth] = [gen.address(1), gen.address(2), gen.address(3), gen.address(4)];
        useSearchParamsMock.mockReturnValue(searchParams(null));
        useAccountOwnedTokensMock.mockReturnValue(
            makeEntryWith(
                [first, second, third, fourth].map(mint => makeTokenAccount(UNIT_AMOUNT, TOKEN_ACCOUNT_A, mint)),
            ),
        );
        useVerifiedTokenInfosMock.mockReturnValue(verified(tokenInfo(fourth, true), tokenInfo(second, true)));

        render(<OwnedTokensCard address={OWNER} />);

        expect(visibleMints()).toEqual([second, fourth, first, third]);
        expect(useVerifiedTokenInfosMock).toHaveBeenCalledWith({
            cluster: Cluster.Mainnet,
            genesisHash: 'genesis',
            mints: [first, second, third, fourth],
        });
    });
});

describe('should page the ordered holdings', () => {
    // 25 mints so the 20-row first page leaves a remainder, with the verified ones last in RPC order.
    const allMints = Array.from({ length: 25 }, (_, index) => gen.address(index + 10));
    const verifiedMints = allMints.slice(-5);

    beforeEach(() => {
        useSearchParamsMock.mockReturnValue(searchParams(null));
        useAccountOwnedTokensMock.mockReturnValue(
            makeEntryWith(allMints.map(mint => makeTokenAccount(UNIT_AMOUNT, TOKEN_ACCOUNT_A, mint))),
        );
        useVerifiedTokenInfosMock.mockReturnValue(verified(...verifiedMints.map(mint => tokenInfo(mint, true))));
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should fill the first page from the top of the ordered list, not from RPC order', () => {
        render(<OwnedTokensCard address={OWNER} />);

        const firstPage = visibleMints();
        expect(firstPage).toHaveLength(20);
        // Last five by RPC order, first five once ordered.
        expect(firstPage.slice(0, 5)).toEqual(verifiedMints);
    });

    // A lookup of every holding sends one Jupiter request per `TOKEN_INFO_REQUEST_LIMIT` mints and gets rate limited.
    it('should look up token info only for the unverified mints on screen', async () => {
        render(<OwnedTokensCard address={OWNER} />);

        expect(lookedUpMints()).toEqual(new Set(allMints.slice(0, 15)));

        await userEvent.click(screen.getByRole('button', { name: 'Load More (20 of 25)' }));

        expect(lookedUpMints()).toEqual(new Set(allMints.slice(0, 20)));
    });

    it('should count unique mints in the footer, not token accounts', () => {
        render(<OwnedTokensCard address={OWNER} />);

        expect(loadMoreButton()).toHaveTextContent('Load More (20 of 25)');
    });

    it('should append the next page without moving the rows already on screen', async () => {
        render(<OwnedTokensCard address={OWNER} />);
        const firstPage = visibleMints();

        await userEvent.click(screen.getByRole('button', { name: 'Load More (20 of 25)' }));

        expect(visibleMints()).toHaveLength(25);
        expect(visibleMints().slice(0, 20)).toEqual(firstPage);
        expect(loadMoreButton()).toBeUndefined();
    });
});

describe('should render the account address column only in detail display', () => {
    beforeEach(() => {
        useAccountOwnedTokensMock.mockReturnValue(makeEntry());
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should render the account address ahead of the mint in detail display', () => {
        useSearchParamsMock.mockReturnValue(searchParams('detail'));

        render(<OwnedTokensCard address={OWNER} />);

        expect(grid().getByText('Account Address')).toBeInTheDocument();
        expect(
            grid()
                .getAllByTestId('address')
                .map(node => node.textContent),
        ).toEqual([TOKEN_ACCOUNT_A, MINT]);
    });

    it('should omit the account address in summary display', () => {
        useSearchParamsMock.mockReturnValue(searchParams(null));

        render(<OwnedTokensCard address={OWNER} />);

        expect(screen.queryByText('Account Address')).not.toBeInTheDocument();
        expect(visibleMints()).toEqual([MINT]);
    });

    // One row per mint, so a mint held twice shows a summed balance against a single account.
    it('should show the last account of a mint held in several', () => {
        useSearchParamsMock.mockReturnValue(searchParams('detail'));
        useAccountOwnedTokensMock.mockReturnValue(twoAccountsOfOneMint());

        render(<OwnedTokensCard address={OWNER} />);

        expect(
            grid()
                .getAllByTestId('address')
                .map(node => node.textContent),
        ).toEqual([TOKEN_ACCOUNT_B, MINT]);
    });
});

describe('should project holdings into the mobile stack', () => {
    beforeEach(() => {
        useSearchParamsMock.mockReturnValue(searchParams(null));
        useAccountOwnedTokensMock.mockReturnValue(makeEntry());
        listTokens(USDC);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // `mobile="stack"` renders the desktop grid and the mobile stack together, so counting occurrences
    // across both layouts shows the mobile projection without reaching into the DOM.
    it('should inline the logo into the Mint field and drop the standalone Logo field on mobile', () => {
        render(<OwnedTokensCard address={OWNER} />);

        // The Logo column is hidden on mobile (desktop only) but the logo is inlined into the mobile Mint
        // field, so exactly two logos render: one more than desktop-only, one fewer than a visible column.
        expect(screen.getAllByTestId('token-logo').map(logo => logo.getAttribute('data-uri'))).toEqual([LOGO, LOGO]);
        // The 'Logo' header is desktop-only; the mobile Mint field is labelled 'Mint' (not 'Mint Address').
        expect(screen.getAllByText('Logo')).toHaveLength(1);
        expect(screen.getByText('Mint')).toBeInTheDocument();
    });
});
