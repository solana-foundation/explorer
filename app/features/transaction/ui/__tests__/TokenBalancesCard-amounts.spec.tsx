import { type ParsedMessageAccount, PublicKey, type TokenBalance } from '@solana/web3.js';
import { render } from '@testing-library/react';
import { Cluster } from '@utils/cluster';

import { generateTokenBalanceRows, TokenBalancesCardInner } from '../TokenBalancesCard';

const MINT = 'XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W';
const OTHER_MINT = 'So11111111111111111111111111111111111111112';
const ACCOUNTS: ParsedMessageAccount[] = [{ pubkey: new PublicKey(OTHER_MINT), signer: false, writable: true }];

const mocks = vi.hoisted(() => ({ multiplier: '1' }));

vi.mock('@/app/providers/cluster', () => ({ useCluster: () => ({ cluster: Cluster.Custom, genesisHash: undefined }) }));
vi.mock('@/app/providers/accounts/tokens', async importOriginal => ({
    ...(await importOriginal<typeof import('@/app/providers/accounts/tokens')>()),
    useScaledUiAmountMultiplier: () => ({ multiplier: mocks.multiplier, status: 'known' }),
}));
vi.mock('@components/common/Address', () => ({ Address: () => <span>address</span> }));
vi.mock('@components/account/token-extensions/ScaledUiAmountMultiplierTooltip', () => ({ default: () => null }));

describe('generateTokenBalanceRows', () => {
    // A simulation reads the pre balance from an account, where the RPC scales `uiAmountString`.
    it('should read the raw amounts, not the UI amounts', () => {
        const rows = generateTokenBalanceRows(
            [tokenBalance(MINT, '100', '1.01')],
            [tokenBalance(MINT, '150', '1.5')],
            ACCOUNTS,
        );

        expect(rows).toMatchObject([{ decimals: 2, mint: MINT, postAmount: '150', preAmount: '100' }]);
    });

    it('should zero the post amount of an account that has no post balance', () => {
        const rows = generateTokenBalanceRows([tokenBalance(MINT, '100', '1')], [], ACCOUNTS);

        expect(rows).toMatchObject([{ mint: MINT, postAmount: '0', preAmount: '100' }]);
    });

    it('should return one row for each mint when the mint of an account changes', () => {
        const rows = generateTokenBalanceRows(
            [tokenBalance(MINT, '100', '1')],
            [tokenBalance(OTHER_MINT, '7', '0.07')],
            ACCOUNTS,
        );

        expect(rows).toMatchObject([
            { mint: MINT, postAmount: '0', preAmount: '100' },
            { mint: OTHER_MINT, postAmount: '7', preAmount: '0' },
        ]);
    });
});

describe('TokenBalancesCard amounts', () => {
    // Balances of a mainnet token account. Scaling the raw change gives -0.06047959.
    it('should show the change as the difference of the scaled balances', () => {
        mocks.multiplier = '1.007474126658766';

        const { container } = renderRow({ decimals: 8, postAmount: '3372093639', preAmount: '3378096731' });

        expect(container.textContent).toContain('-0.0604796');
        expect(container.textContent).toContain('33.97297093 tokens');
    });

    it('should not show a small balance in exponential notation', () => {
        mocks.multiplier = '1';

        const { container } = renderRow({ decimals: 8, postAmount: '5', preAmount: '5' });

        expect(container.textContent).toContain('0.00000005 tokens');
    });
});

function tokenBalance(mint: string, amount: string, uiAmountString: string): TokenBalance {
    return { accountIndex: 0, mint, uiTokenAmount: { amount, decimals: 2, uiAmount: null, uiAmountString } };
}

function renderRow(amounts: { decimals: number; postAmount: string; preAmount: string }) {
    return render(
        <TokenBalancesCardInner rows={[{ account: new PublicKey(MINT), accountIndex: 0, mint: MINT, ...amounts }]} />,
    );
}
