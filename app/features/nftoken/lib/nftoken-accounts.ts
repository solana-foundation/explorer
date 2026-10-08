import type { Account } from '@providers/accounts';
import {
    addDecoderSizePrefix,
    type Address,
    address as toAddress,
    fixDecoderSize,
    getAddressDecoder,
    getBytesDecoder,
    getStructDecoder,
    getU8Decoder,
    getU32Decoder,
    getUtf8Decoder,
    type ReadonlyUint8Array,
    transformDecoder,
} from '@solana/kit';

import { startsWith } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';

export const NFTOKEN_ADDRESS = toAddress('nftokf9qcHSYkVSP3P2gUMmV6d4AwjMueXgUu43HyLL');

export type NftokenNftAccount = {
    kind: 'nft';
    address: Address;
    authority: Address;
    authority_can_update: boolean;
    collection: Address | undefined;
    delegate: Address | undefined;
    holder: Address;
    metadata_url: string;
};

export type NftokenCollectionAccount = {
    kind: 'collection';
    address: Address;
    authority: Address;
    authority_can_update: boolean;
    metadata_url: string;
};

export type NftokenAccount = NftokenNftAccount | NftokenCollectionAccount;

export function isNftokenCollection(account: Account): boolean {
    return parseNftokenAccount(account)?.kind === 'collection';
}

export function parseNftokenAccount(account: Account): NftokenAccount | undefined {
    const { raw } = account.data;
    if (!raw || !isOwnedByNftoken(account)) return undefined;

    const address = toAddress(account.pubkey.toBase58());
    return parseNftokenNftAccount(address, raw) ?? parseNftokenCollectionAccount(address, raw);
}

function isOwnedByNftoken(account: Account): boolean {
    return account.owner.toBase58() === NFTOKEN_ADDRESS;
}

export const NFT_ACCOUNT_DISCRIMINATOR: ReadonlyUint8Array = new Uint8Array([33, 180, 91, 53, 236, 15, 63, 97]);

const nftFieldsBeforeCollection = [
    ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
    ['version', versionDecoder()],
    ['holder', getAddressDecoder()],
    ['authority', getAddressDecoder()],
    ['authority_can_update', boolDecoder()],
] as const;

export const NFT_COLLECTION_OFFSET = getStructDecoder([...nftFieldsBeforeCollection]).fixedSize;

const nftAccountDecoder = getStructDecoder([
    ...nftFieldsBeforeCollection,
    ['collection', getAddressDecoder()],
    ['delegate', getAddressDecoder()],
    ['is_frozen', boolDecoder()],
    ['unused', fixDecoderSize(getBytesDecoder(), 4)],
    ['metadata_url', metadataUrlDecoder()],
]);

export function parseNftokenNftAccount(address: Address, data: ReadonlyUint8Array): NftokenNftAccount | undefined {
    if (!startsWith(data, NFT_ACCOUNT_DISCRIMINATOR)) return undefined;

    try {
        const nft = nftAccountDecoder.decode(data);
        return {
            address,
            authority: nft.authority,
            authority_can_update: nft.authority_can_update,
            collection: addressIfSet(nft.collection),
            delegate: addressIfSet(nft.delegate),
            holder: nft.holder,
            kind: 'nft',
            metadata_url: nft.metadata_url,
        };
    } catch (error) {
        Logger.error(error, { address });
        return undefined;
    }
}

const COLLECTION_ACCOUNT_DISCRIMINATOR: ReadonlyUint8Array = new Uint8Array([69, 2, 240, 3, 118, 18, 217, 242]);

const collectionAccountDecoder = getStructDecoder([
    ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
    ['version', versionDecoder()],
    ['authority', getAddressDecoder()],
    ['authority_can_update', boolDecoder()],
    ['unused', fixDecoderSize(getBytesDecoder(), 4)],
    ['metadata_url', metadataUrlDecoder()],
]);

function parseNftokenCollectionAccount(
    address: Address,
    data: ReadonlyUint8Array,
): NftokenCollectionAccount | undefined {
    if (!startsWith(data, COLLECTION_ACCOUNT_DISCRIMINATOR)) return undefined;

    try {
        const collection = collectionAccountDecoder.decode(data);
        return {
            address,
            authority: collection.authority,
            authority_can_update: collection.authority_can_update,
            kind: 'collection',
            metadata_url: collection.metadata_url,
        };
    } catch (error) {
        Logger.error(error, { address });
        return undefined;
    }
}

const UNSET_ADDRESS = '11111111111111111111111111111111';

function addressIfSet(address: Address): Address | undefined {
    return address === UNSET_ADDRESS ? undefined : address;
}

function metadataUrlDecoder() {
    return addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder());
}

const ACCOUNT_VERSION = 1;

function versionDecoder() {
    return transformDecoder(getU8Decoder(), version => {
        if (version !== ACCOUNT_VERSION) {
            throw new Error(`expected NFToken account version ${ACCOUNT_VERSION}, got ${version}`);
        }
        return version;
    });
}

function boolDecoder() {
    return transformDecoder(getU8Decoder(), byte => {
        if (byte > 1) throw new Error(`expected a bool byte of 0 or 1, got ${byte}`);
        return byte === 1;
    });
}
