import { gen } from '@__fixtures__/gen';
import { GENESIS_HASHES } from '@entities/chain-id';
import { tokenInfo } from '@entities/token-info/__fixtures__/token-info';
import type { Account } from '@providers/accounts';
import { TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ClusterContext, connectedWithGenesisHash, swrWrapper } from '@/app/__tests__/swr-hook';
import { LABEL_CLUSTER, readLabelAfterFailedCardRequest, stubTokenInfoApi } from '@/app/__tests__/token-label';

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
vi.mock('@components/common/Address', () => ({
    Address: ({ pubkey }: { pubkey: PublicKey }) => <span>{pubkey.toBase58()}</span>,
}));

describe('TokenAccountSection', () => {
    beforeEach(() => {
        stubTokenInfoApi([USDC]);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should show the token symbol of a token account on a custom cluster with the mainnet genesis hash', async () => {
        mock.cluster = connectedWithGenesisHash(Cluster.Custom, GENESIS_HASHES.MAINNET);

        render(<TokenAccountSection account={ACCOUNT} tokenAccount={TOKEN_ACCOUNT} />, { wrapper: swrWrapper() });

        expect(await screen.findByText('Token balance (USDC)')).toBeInTheDocument();
    });

    it('should keep the token label that the batch provider stored when the card request fails', async () => {
        mock.cluster = LABEL_CLUSTER;
        const label = await readLabelAfterFailedCardRequest(
            <TokenAccountSection account={ACCOUNT} tokenAccount={TOKEN_ACCOUNT} />,
            USDC,
        );

        expect(label).toHaveTextContent('USDC');
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
