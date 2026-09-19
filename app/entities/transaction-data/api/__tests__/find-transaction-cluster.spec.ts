import { gen } from '@__fixtures__/gen';
import { createSolanaRpc } from '@solana/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster, type ServerCluster, serverClusterUrl } from '@/app/utils/cluster';

import { findTransactionCluster } from '../find-transaction-cluster';

const mockSend = vi.fn();
const mockGetSignatureStatuses = vi.fn(() => ({ send: mockSend }));

vi.mock('@solana/kit', async () => {
    const actual = await vi.importActual<typeof import('@solana/kit')>('@solana/kit');
    return {
        ...actual,
        createSolanaRpc: vi.fn(() => ({ getSignatureStatuses: mockGetSignatureStatuses })),
    };
});

const SIGNATURE = gen.signature(1);

const NOT_FOUND = { value: [null] };
const FOUND = { value: [{ confirmationStatus: 'finalized', confirmations: null, err: null, slot: 100 }] };

describe('findTransactionCluster', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSend.mockResolvedValue(NOT_FOUND);
    });

    describe('the signature is on one of the clusters', () => {
        it('should report the first cluster that holds the signature', async () => {
            mockSend.mockResolvedValueOnce(NOT_FOUND).mockResolvedValueOnce(FOUND);

            const result = await findTransactionCluster([Cluster.MainnetBeta, Cluster.Devnet], SIGNATURE);

            expect(result).toEqual({ cluster: Cluster.Devnet, kind: 'found' });
        });

        it('should stop probing once a cluster holds the signature', async () => {
            mockSend.mockResolvedValueOnce(FOUND);

            await findTransactionCluster([Cluster.MainnetBeta, Cluster.Devnet, Cluster.Testnet], SIGNATURE);

            expect(mockSend).toHaveBeenCalledTimes(1);
        });

        // Probe policy is the caller's, so the list is walked exactly as given rather than reordered here.
        it('should probe the clusters in the order given', async () => {
            await findTransactionCluster([Cluster.Devnet, Cluster.MainnetBeta], SIGNATURE);

            expect(vi.mocked(createSolanaRpc).mock.calls.map(([url]) => url)).toEqual([
                serverClusterUrl(Cluster.Devnet),
                serverClusterUrl(Cluster.MainnetBeta),
            ]);
        });

        it('should search transaction history, so an older signature is still found', async () => {
            await findTransactionCluster([Cluster.MainnetBeta], SIGNATURE);

            expect(mockGetSignatureStatuses).toHaveBeenCalledWith([SIGNATURE], { searchTransactionHistory: true });
        });
    });

    it('should pass the caller signal to every probe in the walk', async () => {
        const abortSignal = AbortSignal.timeout(1_000);

        await findTransactionCluster([Cluster.MainnetBeta, Cluster.Devnet], SIGNATURE, { abortSignal });

        expect(mockSend).toHaveBeenNthCalledWith(1, { abortSignal });
        expect(mockSend).toHaveBeenNthCalledWith(2, { abortSignal });
    });

    it('should report an aborted probe as an error naming its cluster', async () => {
        const error = new Error('The operation was aborted due to timeout');
        mockSend.mockRejectedValueOnce(error);

        const result = await findTransactionCluster([Cluster.MainnetBeta, Cluster.Devnet], SIGNATURE, {
            abortSignal: AbortSignal.timeout(1_000),
        });

        expect(result).toEqual({ cluster: Cluster.MainnetBeta, error, kind: 'error' });
    });

    it('should send no signal when the caller set no deadline', async () => {
        await findTransactionCluster([Cluster.MainnetBeta], SIGNATURE);

        expect(mockSend).toHaveBeenCalledWith({ abortSignal: undefined });
    });

    it('should report not-found after probing every cluster', async () => {
        // Annotated because an enum member widens to `Cluster` once it is held in a variable, and
        // `Cluster` includes Custom, which the server-side parameter excludes.
        const clusters: ServerCluster[] = [Cluster.MainnetBeta, Cluster.Devnet, Cluster.Testnet];

        const result = await findTransactionCluster(clusters, SIGNATURE);

        expect(result).toEqual({ kind: 'not-found' });
        expect(mockSend).toHaveBeenCalledTimes(clusters.length);
    });

    // An empty `value` array leaves the entry undefined rather than null, which must not read as a hit.
    it('should not report a signature as found when the status response is empty', async () => {
        mockSend.mockResolvedValue({ value: [] });

        const result = await findTransactionCluster([Cluster.MainnetBeta, Cluster.Devnet], SIGNATURE);

        expect(result).toEqual({ kind: 'not-found' });
        expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('should report not-found without any RPC call for an empty cluster list', async () => {
        const result = await findTransactionCluster([], SIGNATURE);

        expect(result).toEqual({ kind: 'not-found' });
        expect(vi.mocked(createSolanaRpc)).not.toHaveBeenCalled();
    });

    describe('failed status checks', () => {
        it('should report the cluster whose status check failed', async () => {
            const error = new Error('Forbidden access');
            mockSend.mockRejectedValueOnce(error);

            const result = await findTransactionCluster([Cluster.MainnetBeta, Cluster.Devnet], SIGNATURE);

            expect(result).toEqual({ cluster: Cluster.MainnetBeta, error, kind: 'error' });
        });

        it('should not probe later clusters once one fails', async () => {
            mockSend.mockRejectedValueOnce(new Error('Forbidden access'));

            await findTransactionCluster([Cluster.MainnetBeta, Cluster.Devnet, Cluster.Testnet], SIGNATURE);

            expect(mockSend).toHaveBeenCalledTimes(1);
        });

        it('should wrap a non-Error rejection so the caller always receives an Error', async () => {
            mockSend.mockRejectedValueOnce('socket hang up');

            const result = await findTransactionCluster([Cluster.MainnetBeta], SIGNATURE);

            expect(result).toEqual({
                cluster: Cluster.MainnetBeta,
                error: new Error('socket hang up'),
                kind: 'error',
            });
        });
    });
});
