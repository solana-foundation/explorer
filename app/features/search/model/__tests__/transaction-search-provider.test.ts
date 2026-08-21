import { getBase58Decoder } from '@solana/kit';
import { PUBLIC_KEY_LENGTH, SIGNATURE_LENGTH_IN_BYTES } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { transactionSearchProvider } from '../transaction-search-provider';
import { createSearchContext } from './provider-test-utils';

const BASE58_DECODER = getBase58Decoder();

const ctx = createSearchContext();

describe('transactionSearchProvider', () => {
    it('should have kind "fallback"', () => {
        expect(transactionSearchProvider.kind).toBe('fallback');
    });

    it('should return a transaction option for a valid 64-byte bs58 string', () => {
        const sig = BASE58_DECODER.decode(new Uint8Array(SIGNATURE_LENGTH_IN_BYTES));
        const results = transactionSearchProvider.search(sig, ctx);
        expect(results).toEqual([
            {
                label: 'Transactions',
                options: [{ label: sig, pathname: `/tx/${sig}`, type: 'tx', value: [sig] }],
            },
        ]);
    });

    it('should return empty for a 32-byte bs58 string', () => {
        const address = BASE58_DECODER.decode(new Uint8Array(PUBLIC_KEY_LENGTH));
        expect(transactionSearchProvider.search(address, ctx)).toEqual([]);
    });

    it('should return empty for invalid bs58', () => {
        expect(transactionSearchProvider.search('not-valid!!!', ctx)).toEqual([]);
    });
});
