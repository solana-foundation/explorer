import { decodeNftokenCollectionAccount, decodeNftokenNftAccount, NFTOKEN_ADDRESS } from '@explorer/decoder-nftoken';
import type { Account } from '@providers/accounts';
import { type Address, address as toAddress, type ReadonlyUint8Array } from '@solana/kit';

import { Logger } from '@/app/shared/lib/logger';

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

export function parseNftokenNftAccount(address: Address, data: ReadonlyUint8Array): NftokenNftAccount | undefined {
    try {
        const nft = decodeNftokenNftAccount(address, data);
        if (!nft) return undefined;
        return {
            address,
            authority: toAddress(nft.authority),
            authority_can_update: nft.authority_can_update,
            collection: addressIfSet(nft.collection),
            delegate: addressIfSet(nft.delegate),
            holder: toAddress(nft.holder),
            kind: 'nft',
            metadata_url: nft.metadata_url,
        };
    } catch (error) {
        Logger.error(error, { address });
        return undefined;
    }
}

function parseNftokenCollectionAccount(
    address: Address,
    data: ReadonlyUint8Array,
): NftokenCollectionAccount | undefined {
    try {
        const collection = decodeNftokenCollectionAccount(address, data);
        if (!collection || collection.metadata_url === null) return undefined;
        return {
            address,
            authority: toAddress(collection.authority),
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

function addressIfSet(address: string | null): Address | undefined {
    return address === null || address === UNSET_ADDRESS ? undefined : toAddress(address);
}
