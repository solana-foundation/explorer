import {
    isNFTokenAccount,
    parseNFTokenCollectionAccount,
    parseNFTokenNFTAccount,
} from '@components/account/nftoken/isNFTokenAccount';
import { NFTOKEN_ADDRESS } from '@explorer/decoder-nftoken';
import { PublicKey } from '@solana/web3.js';

const NFT_ACCOUNT_DISCRIMINATOR = Uint8Array.of(33, 180, 91, 53, 236, 15, 63, 97);
const COLLECTION_AUTHORITY = new PublicKey('7txXZZD6Um59YoLMF7XUNimbMjsqsWhc7g2EniiTrmp1');
const NFT_PUBKEY = new PublicKey('FagABcRBhZH27JDtu6A1Jo9woXyoznP28QujLkxkN9Hj');

function nftokenAccount(raw: Uint8Array | undefined, owner: PublicKey = new PublicKey(NFTOKEN_ADDRESS)) {
    return {
        data: { raw: raw as Buffer | undefined },
        executable: false,
        lamports: 1,
        owner,
        pubkey: NFT_PUBKEY,
        space: raw?.length ?? 0,
    };
}

describe('isNFTokenAccount', () => {
    it('should accept an NFToken-owned account with raw data', () => {
        expect(isNFTokenAccount(nftokenAccount(NFT_ACCOUNT_DISCRIMINATOR))).toBe(true);
    });

    it('should reject an account owned by another program', () => {
        expect(isNFTokenAccount(nftokenAccount(NFT_ACCOUNT_DISCRIMINATOR, PublicKey.default))).toBe(false);
    });

    it('should reject an NFToken-owned account with no raw data', () => {
        expect(isNFTokenAccount(nftokenAccount(undefined))).toBe(false);
    });
});

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

describe('parseNFTokenAccounts', () => {
    it('should parse a collection with the account address and base58 authority', () => {
        const collection = parseNFTokenCollectionAccount(
            nftokenAccount(collectionAccountData('https://example.com/collection.json')),
        );

        expect(collection).toEqual({
            address: NFT_PUBKEY.toBase58(),
            authority: COLLECTION_AUTHORITY.toBase58(),
            authority_can_update: true,
            metadata_url: 'https://example.com/collection.json',
        });
    });

    it('should reject a collection account passed to the NFT parser', () => {
        expect(parseNFTokenNFTAccount(nftokenAccount(collectionAccountData('https://x.test')))).toBeNull();
    });

    it('should return null for an account owned by another program', () => {
        const account = nftokenAccount(NFT_ACCOUNT_DISCRIMINATOR, PublicKey.default);

        expect(parseNFTokenNFTAccount(account)).toBeNull();
        expect(parseNFTokenCollectionAccount(account)).toBeNull();
    });

    it('should return null rather than throw when the decoder rejects malformed data', () => {
        // Carries the NFT discriminator but nothing after it, so the layout runs off the end of the buffer.
        expect(parseNFTokenNFTAccount(nftokenAccount(NFT_ACCOUNT_DISCRIMINATOR))).toBeNull();
    });
});
