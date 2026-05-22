import { PUBLIC_KEY_LENGTH, SIGNATURE_LENGTH_IN_BYTES } from '@solana/web3.js';
import bs58 from 'bs58';
import { describe, expect, it } from 'vitest';

import { accountSearchProvider } from '../account-search-provider';
import { createSearchContext } from './provider-test-utils';

const ctx = createSearchContext();

describe('accountSearchProvider', () => {
    it('should have kind "fallback"', () => {
        expect(accountSearchProvider.kind).toBe('fallback');
    });

    it('should return an account option for a valid 32-byte bs58 string', () => {
        const address = bs58.encode(new Uint8Array(PUBLIC_KEY_LENGTH));
        const results = accountSearchProvider.search(address, ctx);
        expect(results).toEqual([
            {
                label: 'Accounts',
                options: [{ label: address, pathname: '/address/' + address, type: 'address', value: [address] }],
            },
        ]);
    });

    it('should return empty for a 64-byte bs58 string', () => {
        const sig = bs58.encode(new Uint8Array(SIGNATURE_LENGTH_IN_BYTES));
        expect(accountSearchProvider.search(sig, ctx)).toEqual([]);
    });

    it('should return empty for invalid bs58', () => {
        expect(accountSearchProvider.search('not-valid-bs58!!!', ctx)).toEqual([]);
    });
});
