import { getAddressEncoder } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import {
    accountBytes,
    COLLECTION,
    COLLECTION_CAN_UPDATE_OFFSET,
    COLLECTION_FIELD,
    collectionAccount,
    MAINNET_AUTHORITY,
    MAINNET_COLLECTION,
    MAINNET_NFTS,
    NFT_CAN_UPDATE_OFFSET,
    nftokenAccount,
    WALLET,
} from '../../__tests__/fixtures';
import { isNftokenCollection, parseNftokenAccount, parseNftokenNftAccount } from '../nftoken-accounts';

const [NFT] = MAINNET_NFTS;
const DELEGATE_OFFSET = 106;
const VERSION_OFFSET = 8;
const NFT_IS_FROZEN_OFFSET = 138;

afterEach(() => {
    vi.clearAllMocks();
});

describe('isNftokenCollection', () => {
    it('should return true for a collection account', () => {
        expect(isNftokenCollection(collectionAccount())).toBe(true);
    });

    it('should return false for an NFT account', () => {
        expect(isNftokenCollection(nftokenAccount(accountBytes(NFT.base64), NFT.pubkey))).toBe(false);
    });
});

describe('parseNftokenAccount', () => {
    it('should parse a mainnet NFT account', () => {
        expect(parseNftokenAccount(nftokenAccount(accountBytes(NFT.base64), NFT.pubkey))).toEqual({
            address: NFT.pubkey,
            authority: MAINNET_AUTHORITY,
            authority_can_update: true,
            collection: COLLECTION,
            delegate: undefined,
            holder: NFT.holder,
            kind: 'nft',
            metadata_url: NFT.metadataUrl,
        });
    });

    it('should parse an NFT account with zero padding after its metadata URL', () => {
        const padded = new Uint8Array([...accountBytes(NFT.base64), ...new Uint8Array(33)]);

        expect(parseNftokenAccount(nftokenAccount(padded, NFT.pubkey))).toMatchObject({
            kind: 'nft',
            metadata_url: NFT.metadataUrl,
        });
    });

    it('should parse a mainnet collection account', () => {
        expect(parseNftokenAccount(collectionAccount())).toEqual({
            address: COLLECTION,
            authority: MAINNET_AUTHORITY,
            authority_can_update: true,
            kind: 'collection',
            metadata_url: MAINNET_COLLECTION.metadataUrl,
        });
    });

    it.each([
        ['an NFT', NFT.base64, NFT_CAN_UPDATE_OFFSET],
        ['a collection', MAINNET_COLLECTION.base64, COLLECTION_CAN_UPDATE_OFFSET],
    ])('should decode a zero update flag as false for %s account', (_, base64, offset) => {
        const data = accountBytes(base64);
        data[offset] = 0;

        expect(parseNftokenAccount(nftokenAccount(data, NFT.pubkey))?.authority_can_update).toBe(false);
    });

    it.each([
        ['an NFT', NFT.base64, NFT.pubkey],
        ['a collection', MAINNET_COLLECTION.base64, COLLECTION],
    ])('should log and return undefined for %s account with an unknown version', (_, base64, pubkey) => {
        const data = accountBytes(base64);
        data[VERSION_OFFSET] = 2;

        expect(parseNftokenAccount(nftokenAccount(data, pubkey))).toBeUndefined();
        expect(Logger.error).toHaveBeenCalledExactlyOnceWith(expect.any(Error), { address: pubkey });
    });

    it.each([
        ['the update flag of an NFT', NFT.base64, NFT.pubkey, NFT_CAN_UPDATE_OFFSET],
        ['the frozen flag of an NFT', NFT.base64, NFT.pubkey, NFT_IS_FROZEN_OFFSET],
        ['the update flag of a collection', MAINNET_COLLECTION.base64, COLLECTION, COLLECTION_CAN_UPDATE_OFFSET],
    ])('should log and return undefined when %s is not 0 or 1', (_, base64, pubkey, offset) => {
        const data = accountBytes(base64);
        data[offset] = 7;

        expect(parseNftokenAccount(nftokenAccount(data, pubkey))).toBeUndefined();
        expect(Logger.error).toHaveBeenCalledExactlyOnceWith(expect.any(Error), { address: pubkey });
    });

    it('should return undefined for an account the NFToken program does not own', () => {
        expect(parseNftokenAccount(foreignAccount())).toBeUndefined();
    });

    it('should return undefined for an account without raw data', () => {
        expect(parseNftokenAccount(accountWithoutRawData())).toBeUndefined();
    });

    it('should return undefined for account data too short to hold a discriminator', () => {
        expect(parseNftokenAccount(nftokenAccount(new Uint8Array([33, 180, 91]), NFT.pubkey))).toBeUndefined();
        expect(parseNftokenAccount(nftokenAccount(new Uint8Array([69, 2, 240]), NFT.pubkey))).toBeUndefined();
    });

    it('should return undefined for an unknown discriminator', () => {
        expect(parseNftokenAccount(nftokenAccount(new Uint8Array(188), NFT.pubkey))).toBeUndefined();
    });

    it('should log and return undefined for a truncated NFT account', () => {
        expect(parseNftokenAccount(nftokenAccount(accountBytes(NFT.base64).slice(0, 100), NFT.pubkey))).toBeUndefined();
        expect(Logger.error).toHaveBeenCalledExactlyOnceWith(expect.any(Error), { address: NFT.pubkey });
    });

    it('should log and return undefined for a truncated collection account', () => {
        const data = accountBytes(MAINNET_COLLECTION.base64).slice(0, 60);

        expect(parseNftokenAccount(nftokenAccount(data, COLLECTION))).toBeUndefined();
        expect(Logger.error).toHaveBeenCalledExactlyOnceWith(expect.any(Error), { address: COLLECTION });
    });
});

describe('parseNftokenNftAccount', () => {
    it('should return undefined for a collection account without logging', () => {
        expect(parseNftokenNftAccount(COLLECTION, accountBytes(MAINNET_COLLECTION.base64))).toBeUndefined();
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should read an all-zero collection as no collection', () => {
        const data = accountBytes(NFT.base64);
        data.fill(0, COLLECTION_FIELD.start, COLLECTION_FIELD.end);

        expect(parseNftokenNftAccount(NFT.pubkey, data)?.collection).toBeUndefined();
    });

    it('should keep a delegate that is set', () => {
        const data = accountBytes(NFT.base64);
        data.set(getAddressEncoder().encode(WALLET), DELEGATE_OFFSET);

        expect(parseNftokenNftAccount(NFT.pubkey, data)?.delegate).toBe(WALLET);
    });
});

function foreignAccount() {
    return { ...nftokenAccount(accountBytes(NFT.base64), NFT.pubkey), owner: new PublicKey(WALLET) };
}

function accountWithoutRawData() {
    return { ...nftokenAccount(accountBytes(NFT.base64), NFT.pubkey), data: {} };
}
