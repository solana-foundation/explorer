import { gen } from '@__fixtures__/gen';
import type * as SolanaKit from '@solana/kit';
import { SystemProgram } from '@solana/web3.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchTransactionDetails } from '../fetch-transaction-details';

// The global setup stubs `createSolanaRpc` so no test reaches the network; these tests exercise the
// real client against a stubbed `fetch` instead.
vi.mock('@solana/kit', async () => await vi.importActual<typeof SolanaKit>('@solana/kit'));

const URL = 'https://mock.rpc';
const SIGNATURE = gen.signature(1);
const FEE_PAYER = gen.address(1);
const SYSTEM_PROGRAM = SystemProgram.programId.toBase58();

const fetchMock = vi.fn();

function respondWith(result: unknown) {
    const body = JSON.stringify({ id: 1, jsonrpc: '2.0', result });
    // kit reads the body as text so it can upcast integers to bigints as it parses.
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, text: async () => body });
}

function parsedTransactionResult(version: 'legacy' | 0 | 1) {
    return {
        blockTime: 1_778_761_079,
        meta: {
            computeUnitsConsumed: 8442,
            err: null,
            fee: 5000,
            logMessages: [`Program ${SYSTEM_PROGRAM} invoke [1]`],
            postBalances: [900_000_000],
            preBalances: [1_000_000_000],
        },
        slot: 372_654_321,
        transaction: {
            message: {
                accountKeys: [{ pubkey: FEE_PAYER, signer: true, source: 'transaction', writable: true }],
                instructions: [
                    {
                        parsed: { info: { lamports: 100_000_000 }, type: 'transfer' },
                        program: 'system',
                        programId: SYSTEM_PROGRAM,
                    },
                ],
                recentBlockhash: gen.blockhash(),
            },
            signatures: [SIGNATURE],
        },
        version,
    };
}

function requestBody() {
    return JSON.parse(fetchMock.mock.calls[0][1].body);
}

beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

describe('fetchTransactionDetails', () => {
    it('should ask for parsed data at the newest version Explorer renders', async () => {
        respondWith(parsedTransactionResult(0));

        await fetchTransactionDetails(URL, SIGNATURE);

        expect(requestBody().params).toEqual([
            SIGNATURE,
            { commitment: 'confirmed', encoding: 'jsonParsed', maxSupportedTransactionVersion: 1 },
        ]);
    });

    it('should return null when the RPC does not hold the transaction', async () => {
        respondWith(null);

        await expect(fetchTransactionDetails(URL, SIGNATURE)).resolves.toBeNull();
    });

    it.each(['legacy' as const, 0 as const, 1 as const])(
        'should adapt a %s transaction into the web3.js shape consumers read',
        async version => {
            respondWith(parsedTransactionResult(version));

            const result = await fetchTransactionDetails(URL, SIGNATURE);

            expect(result?.version).toBe(version);
            expect(result?.slot).toBe(372_654_321);
            expect(result?.meta?.fee).toBe(5000);
            expect(result?.transaction.message.accountKeys[0].pubkey.toBase58()).toBe(FEE_PAYER);
        },
    );

    it('should read a v1 transaction in a single round trip', async () => {
        respondWith(parsedTransactionResult(1));

        await fetchTransactionDetails(URL, SIGNATURE);

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should reject the request once the caller deadline fires', async () => {
        const controller = new AbortController();
        fetchMock.mockImplementationOnce(
            (_url: string, init: RequestInit) =>
                new Promise((_resolve, reject) => {
                    init.signal?.addEventListener('abort', () => reject(new Error('The operation was aborted')));
                }),
        );

        const pending = fetchTransactionDetails(URL, SIGNATURE, { abortSignal: controller.signal });
        controller.abort();

        await expect(pending).rejects.toThrow();
    });

    it('should reject when the RPC call fails, so the provider can report the failure', async () => {
        fetchMock.mockResolvedValueOnce({
            headers: new Headers(),
            ok: false,
            status: 429,
            statusText: 'Too Many Requests',
        });

        await expect(fetchTransactionDetails(URL, SIGNATURE)).rejects.toThrow();
    });
});
