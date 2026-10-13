import { address, getAddressEncoder, getBase58Decoder } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { decodeNftokenCollectionAccount, decodeNftokenNftAccount } from '../decode';
import { NFT_ACCOUNT_COLLECTION_OFFSET, NFT_ACCOUNT_DISCRIMINATOR_BASE58 } from '../layout';

const NFT_ACCOUNT_DISCRIMINATOR = Uint8Array.of(33, 180, 91, 53, 236, 15, 63, 97);
const COLLECTION_ACCOUNT_DISCRIMINATOR = Uint8Array.of(69, 2, 240, 3, 118, 18, 217, 242);

const ACCOUNT_ADDRESS = 'FagABcRBhZH27JDtu6A1Jo9woXyoznP28QujLkxkN9Hj';
const COLLECTION_AUTHORITY = address('7txXZZD6Um59YoLMF7XUNimbMjsqsWhc7g2EniiTrmp1');

/** A collection account: 8-byte discriminator, version, authority, flag, 4 unused, then a borsh `String` URL. */
function collectionAccountData(url: string): Uint8Array {
    const urlBytes = new TextEncoder().encode(url);
    const length = new Uint8Array(4);
    new DataView(length.buffer).setUint32(0, urlBytes.length, true);

    return new Uint8Array([
        ...COLLECTION_ACCOUNT_DISCRIMINATOR,
        1,
        ...getAddressEncoder().encode(COLLECTION_AUTHORITY),
        1,
        ...[0, 0, 0, 0],
        ...length,
        ...urlBytes,
    ]);
}

const NFT_ACCOUNT_DATA = new Uint8Array([
    33, 180, 91, 53, 236, 15, 63, 97, 1, 13, 194, 212, 59, 127, 163, 1, 184, 232, 229, 196, 221, 132, 114, 202, 93, 251,
    147, 255, 156, 194, 45, 162, 89, 138, 54, 129, 145, 16, 170, 225, 110, 171, 80, 175, 146, 42, 195, 197, 124, 142,
    197, 32, 198, 20, 137, 26, 33, 27, 67, 163, 173, 127, 113, 232, 108, 17, 2, 184, 52, 59, 71, 87, 97, 1, 178, 138,
    249, 251, 68, 1, 82, 163, 86, 56, 204, 21, 192, 126, 64, 94, 187, 81, 78, 188, 73, 85, 189, 140, 52, 199, 206, 30,
    238, 117, 158, 114, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 67, 0, 0, 0, 104, 116, 116, 112, 115, 58, 47, 47, 99, 100, 110, 46, 103, 108, 111, 119, 46, 97, 112,
    112, 47, 110, 47, 56, 56, 47, 55, 56, 101, 102, 49, 55, 99, 49, 45, 50, 98, 53, 97, 45, 52, 54, 56, 101, 45, 97,
    101, 56, 102, 45, 55, 52, 48, 51, 56, 53, 54, 101, 57, 102, 48, 48, 46, 106, 115, 111, 110, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);

describe('decodeNftokenNftAccount', () => {
    it('should decode an NFT account', () => {
        const nft = decodeNftokenNftAccount(ACCOUNT_ADDRESS, NFT_ACCOUNT_DATA);

        expect(nft).toBeDefined();
        expect(nft?.address).toBe(ACCOUNT_ADDRESS);
        expect(nft?.metadata_url).toBe('https://cdn.glow.app/n/88/78ef17c1-2b5a-468e-ae8f-7403856e9f00.json');
        expect(nft?.authority_can_update).toBe(true);
    });

    it('should return undefined for a collection account', () => {
        expect(
            decodeNftokenNftAccount(ACCOUNT_ADDRESS, collectionAccountData('https://example.com/collection.json')),
        ).toBeUndefined();
    });

    it('should return undefined for data too short to hold a discriminator', () => {
        expect(decodeNftokenNftAccount(ACCOUNT_ADDRESS, Uint8Array.of(33, 180, 91))).toBeUndefined();
    });

    it('should throw on data carrying the NFT discriminator but truncated mid-layout', () => {
        expect(() => decodeNftokenNftAccount(ACCOUNT_ADDRESS, NFT_ACCOUNT_DISCRIMINATOR)).toThrow();
    });
});

describe('decodeNftokenCollectionAccount', () => {
    it('should decode a collection account, reading its authority as a base58 address', () => {
        const collection = decodeNftokenCollectionAccount(
            ACCOUNT_ADDRESS,
            collectionAccountData('https://example.com/collection.json'),
        );

        expect(collection?.authority).toBe(COLLECTION_AUTHORITY);
        expect(collection?.metadata_url).toBe('https://example.com/collection.json');
    });

    it('should return undefined for an NFT account', () => {
        expect(decodeNftokenCollectionAccount(ACCOUNT_ADDRESS, NFT_ACCOUNT_DATA)).toBeUndefined();
    });

    it('should return undefined for data too short to hold a discriminator', () => {
        expect(decodeNftokenCollectionAccount(ACCOUNT_ADDRESS, Uint8Array.of(69, 2, 240))).toBeUndefined();
    });
});

describe('RPC filter constants', () => {
    it('should expose the NFT discriminator as base58 for a memcmp filter', () => {
        expect(NFT_ACCOUNT_DISCRIMINATOR_BASE58).toBe(getBase58Decoder().decode(NFT_ACCOUNT_DISCRIMINATOR));
    });

    it('should place the collection field after the discriminator, version, holder, authority and flag', () => {
        expect(NFT_ACCOUNT_COLLECTION_OFFSET).toBe(8n + 1n + 32n + 32n + 1n);
    });
});
