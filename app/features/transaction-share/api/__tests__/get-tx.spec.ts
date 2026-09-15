import { gen } from '@__fixtures__/gen';
import { Cluster, serverClusterUrl } from '@utils/cluster';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ fetchTransactionDetails: vi.fn() }));

vi.mock('@entities/transaction-data', () => ({ fetchTransactionDetails: mocks.fetchTransactionDetails }));

import { getTx } from '../get-tx';

const SIGNATURE = gen.signature(1);

afterEach(() => vi.clearAllMocks());

describe('should delegate the transaction fetch to the entity', () => {
    it('should call fetchTransactionDetails with the cluster url first and the signature second', async () => {
        const transaction = { blockTime: 1788174000 };
        mocks.fetchTransactionDetails.mockResolvedValue(transaction);

        const result = await getTx({ cluster: Cluster.Devnet, signature: SIGNATURE });

        expect(mocks.fetchTransactionDetails).toHaveBeenCalledWith(serverClusterUrl(Cluster.Devnet), SIGNATURE, {
            abortSignal: undefined,
        });
        expect(result).toBe(transaction);
    });

    // The url is computed through `serverClusterUrl` rather than hardcoded, so a configured
    // `*_RPC_URL` env var cannot turn this assertion red.
    it('should resolve the url of the cluster it was given', async () => {
        mocks.fetchTransactionDetails.mockResolvedValue({});

        await getTx({ cluster: Cluster.Testnet, signature: SIGNATURE });

        expect(mocks.fetchTransactionDetails).toHaveBeenCalledWith(
            serverClusterUrl(Cluster.Testnet),
            SIGNATURE,
            expect.anything(),
        );
    });
    it('should hand the deadline it was given to the entity', async () => {
        mocks.fetchTransactionDetails.mockResolvedValue({});
        const abortSignal = AbortSignal.timeout(1_000);

        await getTx({ abortSignal, cluster: Cluster.Devnet, signature: SIGNATURE });

        expect(mocks.fetchTransactionDetails).toHaveBeenCalledWith(expect.any(String), SIGNATURE, { abortSignal });
    });

    it('should pass a missing transaction through as null', async () => {
        mocks.fetchTransactionDetails.mockResolvedValue(null);

        await expect(getTx({ cluster: Cluster.MainnetBeta, signature: SIGNATURE })).resolves.toBeNull();
    });
});
