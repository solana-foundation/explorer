import { SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR, SolanaError } from '@solana/kit';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';

import { getTransactionQueue } from '../../lib/get-transaction-queue';
import { fetchParsedTransactions } from '../fetch-parsed-transactions';

const mocks = vi.hoisted(() => ({ fetchTransactionDetails: vi.fn(), logError: vi.fn() }));

vi.mock('@entities/transaction-data', () => ({ fetchTransactionDetails: mocks.fetchTransactionDetails }));
vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: mocks.logError } }));

const TRANSACTION = { slot: 1 };
const LOADED = { status: 'loaded', transaction: TRANSACTION };

beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'Date'] }));
afterEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
});

describe('fetchParsedTransactions', () => {
    it('should not start a fetch while a task of another caller runs in the queue of the url', async () => {
        mocks.fetchTransactionDetails.mockResolvedValue(TRANSACTION);
        const url = 'https://shared.parsed.test';
        let finishTask!: () => void;
        const task = getTransactionQueue(url)(() => new Promise<void>(resolve => (finishTask = resolve)));

        const done = fetchParsedTransactions(options(url, ['a']));
        await vi.advanceTimersByTimeAsync(0);
        expect(mocks.fetchTransactionDetails).not.toHaveBeenCalled();
        finishTask();
        await task;
        await done;

        expect(mocks.fetchTransactionDetails).toHaveBeenCalledOnce();
    });

    it('should start the RPC timeout when the queue runs the fetch', async () => {
        vi.spyOn(AbortSignal, 'timeout').mockImplementation(ms => {
            const controller = new AbortController();
            setTimeout(() => controller.abort(new DOMException('signal timed out', 'TimeoutError')), ms);
            return controller.signal;
        });
        mocks.fetchTransactionDetails.mockImplementation(
            async (_url: string, _signature: string, { abortSignal }: { abortSignal: AbortSignal }) => {
                abortSignal.throwIfAborted();
                return TRANSACTION;
            },
        );
        const url = 'https://timeout.parsed.test';
        let finishTask!: () => void;
        const task = getTransactionQueue(url)(() => new Promise<void>(resolve => (finishTask = resolve)));
        const onSettled = vi.fn();

        const done = fetchParsedTransactions({ ...options(url, ['a']), onSettled });
        await vi.advanceTimersByTimeAsync(UPSTREAM_TIMEOUT_MS + 1);
        finishTask();
        await task;
        await done;

        expect(onSettled.mock.calls).toEqual([['a', LOADED]]);
    });

    it('should fetch a rate limited signature again and report its transaction', async () => {
        mocks.fetchTransactionDetails.mockRejectedValueOnce(rateLimited()).mockResolvedValue(TRANSACTION);
        const onSettled = vi.fn();

        const done = fetchParsedTransactions({ ...options('https://retry.parsed.test', ['a']), onSettled });
        await vi.runAllTimersAsync();
        await done;

        expect(onSettled.mock.calls).toEqual([['a', LOADED]]);
    });

    it('should report a rejected fetch and a null transaction as failed, and still report the next signature', async () => {
        mocks.fetchTransactionDetails
            .mockRejectedValueOnce(new Error('fetch failed'))
            .mockResolvedValueOnce(null)
            .mockResolvedValue(TRANSACTION);
        const onSettled = vi.fn();

        await fetchParsedTransactions({ ...options('https://failed.parsed.test', ['a', 'b', 'c']), onSettled });

        expect(onSettled.mock.calls).toEqual([
            ['a', { status: 'failed' }],
            ['b', { status: 'failed' }],
            ['c', LOADED],
        ]);
    });

    it('should report a signature as skipped, without a fetch, when shouldRun returns false', async () => {
        const onSettled = vi.fn();

        await fetchParsedTransactions({
            ...options('https://skipped.parsed.test', ['a']),
            onSettled,
            shouldRun: () => false,
        });

        expect(mocks.fetchTransactionDetails).not.toHaveBeenCalled();
        expect(onSettled.mock.calls).toEqual([['a', { status: 'skipped' }]]);
        expect(mocks.logError).not.toHaveBeenCalled();
    });
});

function options(url: string, signatures: string[]) {
    return { cluster: Cluster.Mainnet, onSettled: () => {}, shouldRun: () => true, signatures, url };
}

function rateLimited(): Error {
    return new SolanaError(SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR, {
        headers: new Headers(),
        message: 'Too Many Requests',
        statusCode: 429,
    });
}
