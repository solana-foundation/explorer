import type * as SolanaKit from '@solana/kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LEGACY_BLOCK_RESPONSE, V1_BLOCK_RESPONSE } from '../../__fixtures__/block-responses';
import { fetchBlock } from '../fetch-block';

// The global setup stubs `createSolanaRpc` so no test reaches the network; these tests exercise the
// real client against a stubbed `fetch` instead.
vi.mock('@solana/kit', async () => await vi.importActual<typeof SolanaKit>('@solana/kit'));

const URL = 'https://mock.rpc';
const SLOT = 440_572_822;

const fetchMock = vi.fn();

function respondWith(result: unknown) {
    const body = JSON.stringify({ id: 1, jsonrpc: '2.0', result });
    // kit reads the body as text so it can upcast integers to bigints as it parses.
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, text: async () => body });
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

describe('fetchBlock', () => {
    it('should ask for base64 transactions at the newest version Explorer renders', async () => {
        respondWith(V1_BLOCK_RESPONSE);

        await fetchBlock(URL, SLOT);

        expect(requestBody().params).toEqual([
            SLOT,
            {
                commitment: 'confirmed',
                encoding: 'base64',
                maxSupportedTransactionVersion: 1,
                rewards: true,
                transactionDetails: 'full',
            },
        ]);
    });

    it('should return null when the RPC does not hold the block', async () => {
        respondWith(null);

        await expect(fetchBlock(URL, SLOT)).resolves.toBeNull();
    });

    it('should read a v1 transaction that a maxSupportedTransactionVersion of 0 would reject', async () => {
        respondWith(V1_BLOCK_RESPONSE);

        const block = await fetchBlock(URL, SLOT);

        expect(block?.transactions).toHaveLength(1);
        expect(block?.transactions[0].version).toBe(1);
    });

    it('should surface a v1 transaction resource limits from the message config', async () => {
        respondWith(V1_BLOCK_RESPONSE);

        const block = await fetchBlock(URL, SLOT);

        expect(block?.transactions[0].transactionConfig).toEqual({
            computeUnitLimit: 10_000,
            loadedAccountsDataSizeLimit: 65_536,
        });
    });

    it('should expose a v1 message through the web3.js interface the block cards read', async () => {
        respondWith(V1_BLOCK_RESPONSE);

        const block = await fetchBlock(URL, SLOT);
        const message = block?.transactions[0].transaction.message;

        expect(message?.compiledInstructions).toHaveLength(1);
        expect(message?.staticAccountKeys).toHaveLength(3);
        expect(message?.isAccountWritable(0)).toBe(true);
        expect(message?.getAccountKeys({ accountKeysFromLookups: undefined }).get(2)?.toBase58()).toBe(
            '11111111111111111111111111111111',
        );
    });

    it('should carry no resource limits for a legacy transaction', async () => {
        respondWith(LEGACY_BLOCK_RESPONSE);

        const block = await fetchBlock(URL, SLOT);

        expect(block?.transactions[0].version).toBe('legacy');
        expect(block?.transactions[0].transactionConfig).toBeUndefined();
    });

    it('should narrow meta amounts to the numbers web3.js consumers expect', async () => {
        respondWith(V1_BLOCK_RESPONSE);

        const block = await fetchBlock(URL, SLOT);
        const meta = block?.transactions[0].meta;

        expect(meta?.fee).toBe(5000);
        expect(meta?.computeUnitsConsumed).toBe(150);
        expect(meta?.preBalances).toEqual([1_000_000_000, 0, 1]);
        expect(meta?.logMessages).toHaveLength(2);
    });

    it('should adapt a transaction whose meta omits inner instructions and loaded addresses', async () => {
        const [transaction] = LEGACY_BLOCK_RESPONSE.transactions;
        const meta = { ...transaction.meta, innerInstructions: undefined, loadedAddresses: undefined };
        respondWith({ ...LEGACY_BLOCK_RESPONSE, transactions: [{ ...transaction, meta }] });

        const block = await fetchBlock(URL, SLOT);

        expect(block?.transactions[0].meta?.innerInstructions).toBeUndefined();
        expect(block?.transactions[0].meta?.loadedAddresses).toBeUndefined();
        expect(block?.transactions[0].version).toBe('legacy');
    });

    it('should adapt a transaction with no meta recorded', async () => {
        const [transaction] = LEGACY_BLOCK_RESPONSE.transactions;
        respondWith({ ...LEGACY_BLOCK_RESPONSE, transactions: [{ ...transaction, meta: null }] });

        const block = await fetchBlock(URL, SLOT);

        expect(block?.transactions[0].meta).toBeNull();
    });

    it('should report the block header fields the overview renders', async () => {
        respondWith(V1_BLOCK_RESPONSE);

        const block = await fetchBlock(URL, SLOT);

        expect(block?.blockhash).toBe(V1_BLOCK_RESPONSE.blockhash);
        expect(block?.previousBlockhash).toBe(V1_BLOCK_RESPONSE.previousBlockhash);
        expect(block?.parentSlot).toBe(440_572_821);
        expect(block?.blockTime).toBe(1_787_266_078);
    });

    it('should carry a commission only on the rewards that have one', async () => {
        respondWith({
            ...V1_BLOCK_RESPONSE,
            rewards: [
                { commission: 5, lamports: 12, postBalance: 100, pubkey: 'Vote111', rewardType: 'Voting' },
                { lamports: 3, postBalance: 50, pubkey: 'Fee111', rewardType: 'Fee' },
            ],
        });

        const block = await fetchBlock(URL, SLOT);

        expect(block?.rewards?.[0].commission).toBe(5);
        expect(block?.rewards?.[1].commission).toBeUndefined();
    });

    it('should keep the readable transactions when one cannot be decoded', async () => {
        const [transaction] = LEGACY_BLOCK_RESPONSE.transactions;
        respondWith({
            ...LEGACY_BLOCK_RESPONSE,
            transactions: [{ ...transaction, transaction: ['not-base64-bytes', 'base64'] }, transaction],
        });

        const block = await fetchBlock(URL, SLOT);

        expect(block?.transactions).toHaveLength(1);
        expect(block?.transactions[0].version).toBe('legacy');
    });

    it('should drop a transaction whose meta does not match the shape the cards read', async () => {
        const [transaction] = LEGACY_BLOCK_RESPONSE.transactions;
        const meta = { ...transaction.meta, postBalances: 'not-an-array' };
        respondWith({ ...LEGACY_BLOCK_RESPONSE, transactions: [{ ...transaction, meta }] });

        const block = await fetchBlock(URL, SLOT);

        expect(block?.transactions).toEqual([]);
    });

    it('should adapt a transaction whose meta records no token balances', async () => {
        const [transaction] = LEGACY_BLOCK_RESPONSE.transactions;
        const meta = { ...transaction.meta, postTokenBalances: null, preTokenBalances: null };
        respondWith({ ...LEGACY_BLOCK_RESPONSE, transactions: [{ ...transaction, meta }] });

        const block = await fetchBlock(URL, SLOT);

        expect(block?.transactions[0].meta?.postTokenBalances).toBeUndefined();
        expect(block?.transactions[0].meta?.preTokenBalances).toBeUndefined();
    });

    it('should reject a block that is missing the fields every subpage renders', async () => {
        const withoutBlockhash = { ...V1_BLOCK_RESPONSE, blockhash: undefined };
        respondWith(withoutBlockhash);

        await expect(fetchBlock(URL, SLOT)).rejects.toThrow();
    });

    it('should render each transaction signature in signer order', async () => {
        respondWith(V1_BLOCK_RESPONSE);

        const block = await fetchBlock(URL, SLOT);

        expect(block?.transactions[0].transaction.signatures).toEqual([
            '3S16GMLh2fH28SAhXWRRqogYudd8MPvZD39Ee22ZS6F2jeJQLhYNpKfdkZxo49dnKDsoXvtdBxQFRaDbvd1QnZaW',
        ]);
    });
});
