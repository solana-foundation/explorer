import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getTransactionsForAddress } from '../get-transactions-for-address';

const URL = 'https://mock.rpc';
const ADDRESS = 'rexav5eNTUSNT1K2N7cfRjnthwhcP5BC25v2tA4rW4h';

const fetchMock = vi.fn();

function respondWith(body: unknown, { ok = true, status = 200 }: { ok?: boolean; status?: number } = {}) {
    fetchMock.mockResolvedValueOnce({ json: async () => body, ok, status });
}

function result(data: unknown[], paginationToken: string | null = null) {
    return { id: 1, jsonrpc: '2.0', result: { data, paginationToken } };
}

function call(overrides: { paginationToken?: string } = {}) {
    return getTransactionsForAddress({ address: ADDRESS, filters: {}, limit: 25, url: URL, ...overrides });
}

beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

describe('getTransactionsForAddress', () => {
    it('should normalise a well-formed page into history rows', async () => {
        respondWith(
            result([
                {
                    blockTime: 1_777_879_636,
                    confirmationStatus: 'finalized',
                    err: 'InvalidProgramForExecution',
                    memo: null,
                    signature: 'sig-a',
                    slot: 459_981_298,
                    transactionIndex: 35,
                },
            ]),
        );

        const page = await call();

        expect(page.data).toEqual([
            {
                blockTime: 1_777_879_636,
                confirmationStatus: 'finalized',
                err: 'InvalidProgramForExecution',
                memo: null,
                signature: 'sig-a',
                slot: 459_981_298,
                transactionIndex: 35,
            },
        ]);
        // The wire's null becomes an absent cursor so callers can test it uniformly.
        expect(page.paginationToken).toBeUndefined();
    });

    it('should preserve a structured instruction error', async () => {
        respondWith(result([{ err: { InstructionError: [0, { Custom: 1 }] }, signature: 'sig-a', slot: 1 }]));

        const page = await call();

        expect(page.data[0].err).toEqual({ InstructionError: [0, { Custom: 1 }] });
    });

    it('should default absent err and memo to null, matching the web3.js row shape', async () => {
        respondWith(result([{ signature: 'sig-a', slot: 1 }]));

        const page = await call();

        expect(page.data[0]).toMatchObject({ err: null, memo: null });
        expect(page.data[0].blockTime).toBeUndefined();
    });

    it('should drop an unrecognised confirmationStatus rather than reject the page', async () => {
        respondWith(result([{ confirmationStatus: 'quantum-finalized', signature: 'sig-a', slot: 1 }]));

        const page = await call();

        expect(page.data).toHaveLength(1);
        expect(page.data[0].confirmationStatus).toBeUndefined();
    });

    it('should accept unknown extra fields so an endpoint can extend the response', async () => {
        respondWith(result([{ costUnits: 1234, signature: 'sig-a', slot: 1 }]));

        await expect(call()).resolves.toMatchObject({ data: [{ signature: 'sig-a' }] });
    });

    it('should reject a row missing the fields the history table reads', async () => {
        respondWith(result([{ slot: 1 }]));

        await expect(call()).rejects.toThrow();
    });

    it('should reject a result whose data is not an array', async () => {
        respondWith({ id: 1, jsonrpc: '2.0', result: { data: { signature: 'sig-a' }, paginationToken: null } });

        await expect(call()).rejects.toThrow();
    });

    it('should surface a JSON-RPC error with its code so the caller can classify it', async () => {
        respondWith({ error: { code: -32601, message: 'Method not found' }, id: 1, jsonrpc: '2.0' });

        await expect(call()).rejects.toMatchObject({ code: -32601, message: 'Method not found' });
    });

    it('should send an explicit null paginationToken on the first page', async () => {
        respondWith(result([]));

        await call();

        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.method).toBe('getTransactionsForAddress');
        expect(body.params[1].paginationToken).toBeNull();
    });

    it('should thread a paginationToken through when paging', async () => {
        respondWith(result([], 'token-page-2'));

        const page = await call({ paginationToken: 'token-page-1' });

        expect(JSON.parse(fetchMock.mock.calls[0][1].body).params[1].paginationToken).toBe('token-page-1');
        expect(page.paginationToken).toBe('token-page-2');
    });
});
