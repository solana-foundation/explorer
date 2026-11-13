import { gen } from '@__fixtures__/gen';
import { GENESIS_HASHES } from '@entities/chain-id/lib/const';
import { tokenInfo } from '@entities/token-info/__fixtures__/token-info';
import type { TransactionWithMeta } from '@entities/transaction-data';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { renderHook } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ClusterContext, connectedWithGenesisHash, swrWrapper, waitForHook } from '@/app/__tests__/swr-hook';

import { buildParsedTransaction, buildTokenTransferCheckedIx } from '../__fixtures__/builders';
import { useReceiptResult } from '../use-receipt-result';

const mocks = vi.hoisted(() => ({
    cluster: {} as ClusterContext,
    isReceiptEnabled: true,
}));

vi.mock('@providers/cluster', () => ({ useCluster: () => mocks.cluster }));
vi.mock('../../env', () => ({
    get isReceiptEnabled() {
        return mocks.isReceiptEnabled;
    },
}));

const SIGNATURE = gen.signature();
const MINT = gen.publicKey();

describe('useReceiptResult', () => {
    beforeEach(() => {
        mocks.cluster = connectedWithGenesisHash(Cluster.Custom, GENESIS_HASHES.MAINNET);
        mocks.isReceiptEnabled = true;
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => Response.json({ content: [{ ...tokenInfo(MINT.toBase58()), symbol: 'USDC' }] })),
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should show the token symbol on a Custom cluster with the mainnet genesis hash', async () => {
        const tx = tokenTransfer();
        const { result } = renderHook(() => useReceiptResult(SIGNATURE, tx), {
            wrapper: swrWrapper(),
        });

        await waitForHook(() => expect(result.current.data).toMatchObject({ kind: 'ok', receipt: { symbol: 'USDC' } }));
        expect(sentUrls()).toEqual([
            `/api/token-info/${MINT.toBase58()}?cluster=${Cluster.Custom}&genesisHash=${GENESIS_HASHES.MAINNET}`,
        ]);
    });

    it('should build the receipt again when the genesis hash changes', async () => {
        mocks.cluster = connectedWithGenesisHash(Cluster.Custom, GENESIS_HASHES.DEVNET);
        const tx = tokenTransfer();
        const { rerender, result } = renderHook(() => useReceiptResult(SIGNATURE, tx), {
            wrapper: swrWrapper(),
        });
        await waitForHook(() => expect(result.current.data).toMatchObject({ kind: 'ok' }));
        expect(result.current.data).toMatchObject({ receipt: { symbol: undefined } });
        expect(fetch).not.toHaveBeenCalled();

        mocks.cluster = connectedWithGenesisHash(Cluster.Custom, GENESIS_HASHES.MAINNET);
        rerender();

        await waitForHook(() => expect(result.current.data).toMatchObject({ receipt: { symbol: 'USDC' } }));
    });

    it('should build the receipt again when the cluster changes', async () => {
        const tx = tokenTransfer();
        const { rerender, result } = renderHook(() => useReceiptResult(SIGNATURE, tx), {
            wrapper: swrWrapper(),
        });
        await waitForHook(() => expect(result.current.data).toMatchObject({ receipt: { network: 'Custom' } }));

        mocks.cluster = connectedWithGenesisHash(Cluster.MainnetBeta, GENESIS_HASHES.MAINNET);
        rerender();

        await waitForHook(() => expect(result.current.data).toMatchObject({ receipt: { network: 'Mainnet Beta' } }));
    });

    it('should build the receipt when the transaction arrives after mount', async () => {
        const { rerender, result } = renderHook(({ tx }) => useReceiptResult(SIGNATURE, tx), {
            initialProps: { tx: undefined as TransactionWithMeta | undefined },
            wrapper: swrWrapper(),
        });

        rerender({ tx: tokenTransfer() });

        await waitForHook(() => expect(result.current.data?.kind).toBe('ok'));
    });

    it('should show TOKEN when the mint is not a valid address', async () => {
        const tx = tokenTransfer('not-a-mint');
        const { result } = renderHook(() => useReceiptResult(SIGNATURE, tx), {
            wrapper: swrWrapper(),
        });

        await waitForHook(() =>
            expect(result.current.data).toMatchObject({ kind: 'ok', receipt: { total: { unit: 'TOKEN' } } }),
        );
        expect(fetch).not.toHaveBeenCalled();
    });

    it('should not build a receipt when receipts are disabled', async () => {
        mocks.isReceiptEnabled = false;

        const tx = tokenTransfer();
        const { result } = renderHook(() => useReceiptResult(SIGNATURE, tx), {
            wrapper: swrWrapper(),
        });

        await waitForHook(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.data).toBeUndefined();
        expect(fetch).not.toHaveBeenCalled();
    });
});

function tokenTransfer(mint = MINT.toBase58()): TransactionWithMeta {
    const [authority, source, destination, receiver] = [
        gen.publicKey(),
        gen.publicKey(),
        gen.publicKey(),
        gen.publicKey(),
    ];
    const accountKeys = [authority, source, destination];
    const transfer = buildTokenTransferCheckedIx({
        amount: '1000000',
        authority,
        decimals: 6,
        destinationTokenAccount: destination,
        mint: MINT,
        sourceTokenAccount: source,
    });
    return buildParsedTransaction({
        accountKeys,
        instructions: [{ ...transfer, parsed: { ...transfer.parsed, info: { ...transfer.parsed.info, mint } } }],
        postTokenBalances: [
            {
                accountIndex: accountKeys.indexOf(destination),
                mint,
                owner: receiver.toBase58(),
                programId: TOKEN_PROGRAM_ADDRESS,
                uiTokenAmount: { amount: '1000000', decimals: 6, uiAmount: 1, uiAmountString: '1' },
            },
        ],
    });
}

function sentUrls(): string[] {
    return vi.mocked(fetch).mock.calls.map(([input]) => String(input));
}
