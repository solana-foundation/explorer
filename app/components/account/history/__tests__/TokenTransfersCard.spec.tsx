import { DEFAULT_SIGNATURE, gen } from '@__fixtures__/gen';
import { GENESIS_HASHES } from '@entities/chain-id';
import { tokenInfo } from '@entities/token-info/__fixtures__/token-info';
import { buildParsedTransaction, buildTokenTransferCheckedIx } from '@features/receipt/model/__fixtures__/builders';
import type { PublicKey } from '@solana/web3.js';
import { mockAccountHistory, mockConfirmedSignatureInfo } from '@storybook-config/__fixtures__/account-history';
import { render, screen } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ClusterContext, connectedWithGenesisHash, swrWrapper } from '@/app/__tests__/swr-hook';
import { LABEL_CLUSTER, readLabelAfterFailedCardRequest, stubTokenInfoApi } from '@/app/__tests__/token-label';

import { TokenTransfersCard } from '../TokenTransfersCard';

const mock = vi.hoisted(() => ({
    cluster: undefined as ClusterContext | undefined,
}));

vi.mock('@providers/cluster', () => ({ useCluster: () => mock.cluster }));
vi.mock('@providers/accounts', async importOriginal => ({
    ...(await importOriginal<typeof import('@providers/accounts')>()),
    useAccountHistory: () => HISTORY,
}));
vi.mock('@providers/accounts/tokens', async importOriginal => ({
    ...(await importOriginal<typeof import('@providers/accounts/tokens')>()),
    useScaledUiAmountForMint: (_mint: string | undefined, amount: string) => [amount, '1'],
}));
vi.mock('@features/transaction-history/model/use-fetch-account-history', () => ({
    useFetchAccountHistory: () => vi.fn(),
}));
vi.mock('@components/common/Address', () => ({
    Address: ({ pubkey }: { pubkey: PublicKey }) => <span>{pubkey.toBase58()}</span>,
}));
vi.mock('@components/common/Signature', () => ({
    Signature: ({ signature }: { signature: string }) => <span>{signature}</span>,
}));
vi.mock('@components/account/token-extensions/ScaledUiAmountMultiplierTooltip', () => ({ default: () => null }));

const [MINT, AUTHORITY, SOURCE, DESTINATION] = Array.from({ length: 4 }, (_, n) => gen.publicKey(n + 1));
const USDC = { ...tokenInfo(MINT.toBase58()), symbol: 'USDC' };

const HISTORY = mockAccountHistory({
    fetched: [mockConfirmedSignatureInfo({ blockTime: null, signature: DEFAULT_SIGNATURE })],
    transactionMap: new Map([
        [
            DEFAULT_SIGNATURE,
            buildParsedTransaction({
                accountKeys: [AUTHORITY, SOURCE, DESTINATION],
                instructions: [
                    buildTokenTransferCheckedIx({
                        amount: '1500000',
                        authority: AUTHORITY,
                        decimals: 6,
                        destinationTokenAccount: DESTINATION,
                        mint: MINT,
                        sourceTokenAccount: SOURCE,
                    }),
                ],
            }),
        ],
    ]),
});

describe('TokenTransfersCard', () => {
    beforeEach(() => {
        stubTokenInfoApi([USDC]);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should show the token symbol of a transfer on a custom cluster with the mainnet genesis hash', async () => {
        mock.cluster = connectedWithGenesisHash(Cluster.Custom, GENESIS_HASHES.MAINNET);

        render(<TokenTransfersCard address={MINT.toBase58()} />, { wrapper: swrWrapper() });

        expect(await screen.findByText('1.5 USDC')).toBeInTheDocument();
    });

    it('should keep the token label that the batch provider stored when the card request fails', async () => {
        mock.cluster = LABEL_CLUSTER;
        const label = await readLabelAfterFailedCardRequest(<TokenTransfersCard address={MINT.toBase58()} />, USDC);

        expect(label).toHaveTextContent('USDC');
    });
});
