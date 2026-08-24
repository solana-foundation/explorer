import { DEFAULT_SIGNATURE } from '@__fixtures__/gen';
import { ActionType, type Dispatch, FetchStatus } from '@providers/cache';
import { Cluster } from '@utils/cluster';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchTransactionStatus, type TransactionStatus } from '../index';

const MOCK_URL = 'https://api.mainnet-beta.solana.com';

const getSignatureStatuses = vi.fn();
const getBlockTime = vi.fn();
const getRpc = vi.fn((_url: string) => ({
    getBlockTime: (...args: unknown[]) => ({ send: () => getBlockTime(...args) }),
    getSignatureStatuses: (...args: unknown[]) => ({ send: () => getSignatureStatuses(...args) }),
}));
vi.mock('@entities/cluster', async importOriginal => ({
    ...((await importOriginal()) as Record<string, unknown>),
    getRpc: (...args: [string]) => getRpc(...args),
}));

vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn() } }));

function status(overrides: Record<string, unknown> = {}) {
    return {
        confirmationStatus: 'confirmed',
        confirmations: 7n,
        err: null,
        slot: 1234n,
        ...overrides,
    };
}

const dispatch = vi.fn() as unknown as Dispatch<TransactionStatus>;

function lastUpdate() {
    const calls = vi.mocked(dispatch).mock.calls;
    return calls[calls.length - 1][0] as { data?: TransactionStatus; status: FetchStatus; type: ActionType };
}

beforeEach(() => {
    vi.resetAllMocks();
    getRpc.mockReturnValue({
        getBlockTime: (...args: unknown[]) => ({ send: () => getBlockTime(...args) }),
        getSignatureStatuses: (...args: unknown[]) => ({ send: () => getSignatureStatuses(...args) }),
    });
});

describe('fetchTransactionStatus', () => {
    it('should convert kit bigints to numbers', async () => {
        getSignatureStatuses.mockResolvedValue({ value: [status()] });
        getBlockTime.mockResolvedValue(1700000000n);

        await fetchTransactionStatus(dispatch, DEFAULT_SIGNATURE, Cluster.MainnetBeta, MOCK_URL);

        expect(getRpc).toHaveBeenCalledWith(MOCK_URL);
        expect(getSignatureStatuses).toHaveBeenCalledWith([DEFAULT_SIGNATURE], { searchTransactionHistory: true });
        expect(getBlockTime).toHaveBeenCalledWith(1234n);
        expect(lastUpdate()).toMatchObject({
            data: {
                info: {
                    confirmationStatus: 'confirmed',
                    confirmations: 7,
                    result: { err: null },
                    slot: 1234,
                    timestamp: 1700000000,
                },
                signature: DEFAULT_SIGNATURE,
            },
            status: FetchStatus.Fetched,
        });
    });

    it('should report max confirmations for a rooted signature', async () => {
        getSignatureStatuses.mockResolvedValue({
            value: [status({ confirmationStatus: 'finalized', confirmations: null })],
        });
        getBlockTime.mockResolvedValue(1700000000n);

        await fetchTransactionStatus(dispatch, DEFAULT_SIGNATURE, Cluster.MainnetBeta, MOCK_URL);

        expect(lastUpdate().data?.info?.confirmations).toBe('max');
    });

    it('should mark the timestamp unavailable when getBlockTime throws', async () => {
        getSignatureStatuses.mockResolvedValue({ value: [status()] });
        getBlockTime.mockRejectedValue(new Error('slot skipped'));

        await fetchTransactionStatus(dispatch, DEFAULT_SIGNATURE, Cluster.MainnetBeta, MOCK_URL);

        expect(lastUpdate()).toMatchObject({
            data: { info: { timestamp: 'unavailable' } },
            status: FetchStatus.Fetched,
        });
    });

    it('should treat a null status entry as a fetched-but-missing signature', async () => {
        getSignatureStatuses.mockResolvedValue({ value: [null] });

        await fetchTransactionStatus(dispatch, DEFAULT_SIGNATURE, Cluster.MainnetBeta, MOCK_URL);

        expect(getBlockTime).not.toHaveBeenCalled();
        expect(lastUpdate()).toMatchObject({
            data: { info: null, signature: DEFAULT_SIGNATURE },
            status: FetchStatus.Fetched,
        });
    });

    it('should strip bigints out of the transaction error', async () => {
        getSignatureStatuses.mockResolvedValue({
            value: [status({ err: { InstructionError: [2n, { Custom: 6001n }] } })],
        });
        getBlockTime.mockResolvedValue(1700000000n);

        await fetchTransactionStatus(dispatch, DEFAULT_SIGNATURE, Cluster.MainnetBeta, MOCK_URL);

        const err = lastUpdate().data?.info?.result.err;
        expect(err).toStrictEqual({ InstructionError: [2, { Custom: 6001 }] });
        expect(() => JSON.stringify(err)).not.toThrow();
    });

    it('should dispatch FetchFailed when the response carries the wrong number of statuses', async () => {
        getSignatureStatuses.mockResolvedValue({ value: [] });

        await fetchTransactionStatus(dispatch, DEFAULT_SIGNATURE, Cluster.MainnetBeta, MOCK_URL);

        expect(lastUpdate()).toMatchObject({ data: undefined, status: FetchStatus.FetchFailed });
    });

    it('should dispatch FetchFailed when the status request throws', async () => {
        getSignatureStatuses.mockRejectedValue(new Error('rpc boom'));

        await fetchTransactionStatus(dispatch, DEFAULT_SIGNATURE, Cluster.MainnetBeta, MOCK_URL);

        expect(lastUpdate()).toMatchObject({ data: undefined, status: FetchStatus.FetchFailed });
    });
});
