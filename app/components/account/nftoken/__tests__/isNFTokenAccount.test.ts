import { parseNFTokenCollectionAccount, parseNFTokenNFTAccount } from '@components/account/nftoken/isNFTokenAccount';
import { NFTOKEN_ADDRESS } from '@components/account/nftoken/nftoken';
import { PublicKey } from '@solana/web3.js';

import { invariant } from '@/app/shared/lib/invariant';

const COLLECTION_AUTHORITY = new PublicKey('7txXZZD6Um59YoLMF7XUNimbMjsqsWhc7g2EniiTrmp1');

/** A collection account: 8-byte discriminator, version, authority, flag, 4 unused, then a borsh `String` URL. */
function collectionAccountData(url: string): Uint8Array {
    const urlBytes = new TextEncoder().encode(url);
    const length = new Uint8Array(4);
    new DataView(length.buffer).setUint32(0, urlBytes.length, true);

    return new Uint8Array([
        ...[69, 2, 240, 3, 118, 18, 217, 242],
        1,
        ...COLLECTION_AUTHORITY.toBytes(),
        1,
        ...[0, 0, 0, 0],
        ...length,
        ...urlBytes,
    ]);
}

function nftokenAccount(raw: Uint8Array) {
    return {
        data: { raw: raw as Buffer },
        executable: false,
        lamports: 1,
        owner: new PublicKey(NFTOKEN_ADDRESS),
        pubkey: new PublicKey('FagABcRBhZH27JDtu6A1Jo9woXyoznP28QujLkxkN9Hj'),
        space: raw.length,
    };
}

describe('parseNFTokenAccounts', () => {
    it('should parse an NFT', () => {
        const buffer = new Uint8Array([
            33, 180, 91, 53, 236, 15, 63, 97, 1, 13, 194, 212, 59, 127, 163, 1, 184, 232, 229, 196, 221, 132, 114, 202,
            93, 251, 147, 255, 156, 194, 45, 162, 89, 138, 54, 129, 145, 16, 170, 225, 110, 171, 80, 175, 146, 42, 195,
            197, 124, 142, 197, 32, 198, 20, 137, 26, 33, 27, 67, 163, 173, 127, 113, 232, 108, 17, 2, 184, 52, 59, 71,
            87, 97, 1, 178, 138, 249, 251, 68, 1, 82, 163, 86, 56, 204, 21, 192, 126, 64, 94, 187, 81, 78, 188, 73, 85,
            189, 140, 52, 199, 206, 30, 238, 117, 158, 114, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 67, 0, 0, 0, 104, 116, 116, 112, 115, 58, 47, 47, 99,
            100, 110, 46, 103, 108, 111, 119, 46, 97, 112, 112, 47, 110, 47, 56, 56, 47, 55, 56, 101, 102, 49, 55, 99,
            49, 45, 50, 98, 53, 97, 45, 52, 54, 56, 101, 45, 97, 101, 56, 102, 45, 55, 52, 48, 51, 56, 53, 54, 101, 57,
            102, 48, 48, 46, 106, 115, 111, 110, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0,
        ]);
        const nftAccount = parseNFTokenNFTAccount({
            data: { raw: buffer as Buffer },
            executable: false,
            lamports: 1,
            owner: new PublicKey(NFTOKEN_ADDRESS),
            pubkey: new PublicKey('FagABcRBhZH27JDtu6A1Jo9woXyoznP28QujLkxkN9Hj'),
            space: buffer.length,
        });
        invariant(nftAccount, 'expected parseNFTokenNFTAccount to return an NFT account');
        expect(nftAccount.metadata_url).toBe('https://cdn.glow.app/n/88/78ef17c1-2b5a-468e-ae8f-7403856e9f00.json');
    });

    it('should parse a collection, decoding its authority as a base58 address', () => {
        const collection = parseNFTokenCollectionAccount(
            nftokenAccount(collectionAccountData('https://example.com/collection.json')),
        );

        invariant(collection, 'expected parseNFTokenCollectionAccount to return a collection account');
        expect(collection.authority).toBe(COLLECTION_AUTHORITY.toBase58());
        expect(collection.metadata_url).toBe('https://example.com/collection.json');
    });

    it('should reject a collection account passed to the NFT parser', () => {
        const collection = nftokenAccount(collectionAccountData('https://example.com/collection.json'));

        expect(parseNFTokenNFTAccount(collection)).toBeNull();
    });

    it('should reject account data too short to hold a discriminator', () => {
        expect(parseNFTokenNFTAccount(nftokenAccount(new Uint8Array([33, 180, 91])))).toBeNull();
        expect(parseNFTokenCollectionAccount(nftokenAccount(new Uint8Array([69, 2, 240])))).toBeNull();
    });
});
