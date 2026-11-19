import { type TokenInfo, useTokenInfo } from '@entities/token-info';
import { redactedTokenInfo, tokenInfo } from '@entities/token-info/__fixtures__/token-info';
import type { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import type { TokenAccount } from '@validators/accounts/token';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { TokenAccountSection } from '../TokenAccountSection';

vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: Cluster.Mainnet }) }));
vi.mock('@entities/account', () => ({ useRefreshAccount: () => vi.fn() }));
vi.mock('@features/account', () => ({
    AccountCard: ({ children, title }: { children: ReactNode; title: string }) => (
        <section>
            <h2>{title}</h2>
            {children}
        </section>
    ),
}));
vi.mock('@components/common/Address', () => ({ Address: () => null }));
vi.mock('@entities/token-info', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/token-info')>()),
    useTokenInfo: vi.fn(),
}));
vi.mock('@providers/accounts/tokens', async importOriginal => ({
    ...(await importOriginal<typeof import('@providers/accounts/tokens')>()),
    useScaledUiAmountForMint: () => ['1', '1'],
}));

const WEBSITE = 'https://www.circle.com/en/usdc';

const ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const MINT: TokenAccount = {
    info: { decimals: 6, freezeAuthority: null, isInitialized: true, mintAuthority: null, supply: '1' },
    type: 'mint',
};

const TOKEN_ACCOUNT_INFO = {
    mint: ADDRESS,
    owner: ADDRESS,
    state: 'initialized',
    tokenAmount: { amount: '1000000', decimals: 6, uiAmountString: '1' },
};

const ACCOUNT: Account = {
    data: { parsed: { parsed: MINT, program: 'spl-token' } },
    executable: false,
    lamports: 1,
    owner: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    pubkey: new PublicKey(ADDRESS),
    space: 82,
};

describe('TokenAccountSection', () => {
    it.each([
        ['Overview', 'has a name', tokenInfo(ADDRESS)],
        ['Token Mint', 'has no name', redactedTokenInfo(ADDRESS)],
    ])('should title the mint card %s when the token info %s', (title, _, info) => {
        renderMint(info);

        expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    });

    it('should link the website of the token info', () => {
        renderMint({ ...tokenInfo(ADDRESS, true), website: WEBSITE });

        expect(screen.getByRole('link', { name: WEBSITE })).toHaveAttribute('href', WEBSITE);
    });

    it.each([
        { isNative: false, label: 'Token balance (USDC)' },
        { isNative: true, label: 'Token balance (SOL)' },
    ])('should label the balance of a token account with isNative $isNative as $label', ({ isNative, label }) => {
        vi.mocked(useTokenInfo).mockReturnValue({
            isLoading: false,
            kind: 'listed',
            tokenInfo: { ...tokenInfo(ADDRESS), symbol: 'USDC' },
        });

        render(
            <TokenAccountSection
                account={ACCOUNT}
                tokenAccount={{ info: { ...TOKEN_ACCOUNT_INFO, isNative }, type: 'account' }}
            />,
        );

        expect(screen.getByText(label)).toBeInTheDocument();
    });
});

function renderMint(info: TokenInfo): void {
    render(<TokenAccountSection account={ACCOUNT} tokenAccount={MINT} tokenInfo={info} />);
}
