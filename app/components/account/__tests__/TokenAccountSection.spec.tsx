import { gen } from '@__fixtures__/gen';
import { GENESIS_HASHES } from '@entities/chain-id';
import { tokenInfo } from '@entities/token-info/__fixtures__/token-info';
import type { Account } from '@providers/accounts';
import { TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import { render, screen } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ClusterContext, connectedWithGenesisHash, swrWrapper } from '@/app/__tests__/swr-hook';
import { stubTokenInfoRoute } from '@/app/__tests__/token-info-route';

import { TokenAccountSection } from '../TokenAccountSection';

const mock = vi.hoisted(() => ({
    cluster: undefined as ClusterContext | undefined,
}));

vi.mock('@providers/cluster', () => ({ useCluster: () => mock.cluster }));
vi.mock('@providers/accounts/tokens', async importOriginal => ({
    ...(await importOriginal<typeof import('@providers/accounts/tokens')>()),
    useScaledUiAmountForMint: (_mint: string | undefined, amount: string) => [amount, '1'],
}));
vi.mock('@entities/account', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/account')>()),
    useAccountFetching: () => false,
    useRefreshAccount: () => vi.fn(),
}));

describe('TokenAccountSection', () => {
    beforeEach(() => {
        stubTokenInfoRoute([USDC]);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should show the token symbol of a token account on a custom cluster with the mainnet genesis hash', async () => {
        mock.cluster = connectedWithGenesisHash(Cluster.Custom, GENESIS_HASHES.MAINNET);

        render(<TokenAccountSection account={ACCOUNT} tokenAccount={TOKEN_ACCOUNT} />, { wrapper: swrWrapper() });

        expect(await screen.findByText('Token balance (USDC)')).toBeInTheDocument();
    });
});

const MINT = gen.address(1);
const USDC = { ...tokenInfo(MINT), symbol: 'USDC' };

const ACCOUNT: Account = {
    data: {},
    executable: false,
    lamports: 1,
    owner: TOKEN_PROGRAM_ID,
    pubkey: gen.publicKey(2),
    space: 165,
};

const TOKEN_ACCOUNT = {
    info: {
        isNative: false,
        mint: MINT,
        owner: gen.address(3),
        state: 'initialized',
        tokenAmount: { amount: '1500000', decimals: 6, uiAmountString: '1.5' },
    },
    type: 'account' as const,
};
