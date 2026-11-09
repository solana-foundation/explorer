import { gen } from '@__fixtures__/gen';
import { GENESIS_HASHES } from '@entities/chain-id/lib/const';
import { tokenInfo } from '@entities/token-info/__fixtures__/token-info';
import type { TransactionWithMeta } from '@entities/transaction-data';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { renderHook } from '@testing-library/react';
import { Cluster, ClusterStatus } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ClusterContext, clusterContext, swrWrapper, waitForHook } from '@/app/__tests__/swr-hook';

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
        mocks.cluster = connectedTo(Cluster.Custom, GENESIS_HASHES.MAINNET);
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
        expect(sentBodies()).toEqual([
            {
                addresses: [MINT.toBase58()],
                cluster: Cluster.Custom,
                genesisHash: GENESIS_HASHES.MAINNET,
                includeOnChainFallback: false,
            },
        ]);
    });

    it('should build the receipt again when the genesis hash changes', async () => {
        mocks.cluster = connectedTo(Cluster.Custom, GENESIS_HASHES.DEVNET);
        const tx = tokenTransfer();
        const { rerender, result } = renderHook(() => useReceiptResult(SIGNATURE, tx), {
            wrapper: swrWrapper(),
        });
        await waitForHook(() => expect(result.current.data?.kind).toBe('ok'));

        mocks.cluster = connectedTo(Cluster.Custom, GENESIS_HASHES.MAINNET);
        rerender();

        await waitForHook(() =>
            expect(sentBodies().map(body => body.genesisHash)).toEqual([GENESIS_HASHES.DEVNET, GENESIS_HASHES.MAINNET]),
        );
    });

    it('should build the receipt again when the cluster changes', async () => {
        const tx = tokenTransfer();
        const { rerender, result } = renderHook(() => useReceiptResult(SIGNATURE, tx), {
            wrapper: swrWrapper(),
        });
        await waitForHook(() => expect(result.current.data).toMatchObject({ receipt: { network: 'Custom' } }));

        mocks.cluster = connectedTo(Cluster.MainnetBeta, GENESIS_HASHES.MAINNET);
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

const RPC_URL = 'http://localhost:8899';

function connectedTo(cluster: Cluster, genesisHash: string): ClusterContext {
    return {
        ...clusterContext({ cluster, connectableUrl: RPC_URL, status: ClusterStatus.Connected, url: RPC_URL }),
        genesisHash,
    };
}

function tokenTransfer(): TransactionWithMeta {
    const [authority, source, destination, receiver] = [
        gen.publicKey(),
        gen.publicKey(),
        gen.publicKey(),
        gen.publicKey(),
    ];
    const accountKeys = [authority, source, destination];
    return buildParsedTransaction({
        accountKeys,
        instructions: [
            buildTokenTransferCheckedIx({
                amount: '1000000',
                authority,
                decimals: 6,
                destinationTokenAccount: destination,
                mint: MINT,
                sourceTokenAccount: source,
            }),
        ],
        postTokenBalances: [
            {
                accountIndex: accountKeys.indexOf(destination),
                mint: MINT.toBase58(),
                owner: receiver.toBase58(),
                programId: TOKEN_PROGRAM_ADDRESS,
                uiTokenAmount: { amount: '1000000', decimals: 6, uiAmount: 1, uiAmountString: '1' },
            },
        ],
    });
}

function sentBodies(): Record<string, unknown>[] {
    return vi.mocked(fetch).mock.calls.map(([, init]) => JSON.parse(String(init?.body)));
}
