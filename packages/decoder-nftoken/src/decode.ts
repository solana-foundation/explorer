import { type ReadonlyUint8Array } from '@solana/kit';

import {
    collectionAccountDecoder,
    hasCollectionAccountDiscriminator,
    hasNftAccountDiscriminator,
    nftAccountDecoder,
} from './layout';
import type { NftokenCollectionAccount, NftokenNftAccount } from './types';

/**
 * Decodes NFToken NFT account data, or returns `undefined` when the data is some other NFToken account.
 *
 * Throws on data that carries the NFT discriminator but does not match the layout — that is malformed
 * on-chain data rather than a kind mismatch, and the caller decides whether to report it.
 * @param accountAddress - Address of the account the data came from
 * @param data - Raw account data
 */
export function decodeNftokenNftAccount(
    accountAddress: string,
    data: ReadonlyUint8Array,
): NftokenNftAccount | undefined {
    if (!hasNftAccountDiscriminator(data)) return undefined;

    const parsed = nftAccountDecoder.decode(data);

    return {
        address: accountAddress,
        authority: parsed.authority,
        authority_can_update: Boolean(parsed.authority_can_update),
        collection: parsed.collection,

        delegate: parsed.delegate,
        holder: parsed.holder,

        metadata_url: parsed.metadata_url,
    };
}

/**
 * Decodes NFToken collection account data, or returns `undefined` when the data is some other NFToken account.
 *
 * Throws on malformed data for the same reason as {@link decodeNftokenNftAccount}.
 * @param accountAddress - Address of the account the data came from
 * @param data - Raw account data
 */
export function decodeNftokenCollectionAccount(
    accountAddress: string,
    data: ReadonlyUint8Array,
): NftokenCollectionAccount | undefined {
    if (!hasCollectionAccountDiscriminator(data)) return undefined;

    const parsed = collectionAccountDecoder.decode(data);

    return {
        address: accountAddress,
        authority: parsed.authority,
        authority_can_update: Boolean(parsed.authority_can_update),
        metadata_url: parsed.metadata_url,
    };
}
