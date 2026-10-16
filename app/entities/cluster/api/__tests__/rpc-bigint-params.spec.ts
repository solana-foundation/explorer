import { address, type Base58EncodedBytes } from '@solana/kit';
import { describe, expect, it, vi } from 'vitest';

import { stubRpcFetch } from '@/app/__tests__/rpc-fetch';

import { getRpc } from '../get-rpc';

// The wire format under test is produced by kit's real request serializer, so undo the global
// createSolanaRpc mock from test-setup.specs.ts; the fetch stub keeps the request off the network.
vi.mock('@solana/kit', () => vi.importActual('@solana/kit'));

// A global `BigInt.prototype.toJSON` patch runs before kit's replacer inside JSON.stringify,
// turning every bigint RPC param into a JSON string that the RPC rejects with -32602
// INVALID_PARAMS. These tests pin the untouched prototype and the wire format so such a patch
// cannot land unnoticed.
describe('kit rpc bigint params', () => {
    const { respondWith, requestBody } = stubRpcFetch();

    it('should leave BigInt.prototype without a toJSON method', () => {
        expect('toJSON' in BigInt.prototype).toBe(false);
    });

    it('should serialize a bigint memcmp offset as a JSON number', async () => {
        respondWith([]);

        await getRpc('https://bigint-params.test.invalid')
            .getProgramAccounts(address('nftokf9qcHSYkVSP3P2gUMmV6d4AwjMueXgUu43HyLL'), {
                encoding: 'base64',
                filters: [{ memcmp: { bytes: '1' as Base58EncodedBytes, encoding: 'base58', offset: 74n } }],
            })
            .send();

        const offset = requestBody().params[1].filters[0].memcmp.offset;
        expect(offset).toBe(74);
        expect(typeof offset).toBe('number');
    });
});
