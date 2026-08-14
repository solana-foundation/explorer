import { toBase64 } from '@/app/shared/lib/bytes';
import { invariant } from '@/app/shared/lib/invariant';
import { Logger } from '@/app/shared/lib/logger';

import { Account } from '../../../providers/accounts';
import { NFTOKEN_ADDRESS } from './nftoken';
import { NftokenTypes } from './nftoken-types';

export function isNFTokenAccount(account: Account): boolean {
    return Boolean(account.owner.toBase58() === NFTOKEN_ADDRESS && account.data.raw);
}

const nftokenAccountDisc = 'IbRbNewPP2E=';

/**
 * Whether account data opens with the given 8-byte account discriminator.
 *
 * Checked before decoding: the NFT and collection accounts share an owner and a
 * discriminator prefix but not a size, so decoding an account against the wrong
 * layout runs off the end of the buffer and throws.
 */
function hasDiscriminator(data: Uint8Array, discriminator: string): boolean {
    return data.length >= 8 && toBase64(data.slice(0, 8)) === discriminator;
}

export const parseNFTokenNFTAccount = (account: Account): NftokenTypes.NftAccount | null => {
    if (!isNFTokenAccount(account)) {
        return null;
    }

    try {
        invariant(account.data.raw, 'isNFTokenAccount guarantees raw account data');

        if (!hasDiscriminator(account.data.raw, nftokenAccountDisc)) {
            return null;
        }

        const parsed = NftokenTypes.nftAccountDecoder.decode(account.data.raw);

        return {
            address: account.pubkey.toBase58(),
            authority: parsed.authority,
            authority_can_update: Boolean(parsed.authority_can_update),
            collection: parsed.collection,

            delegate: parsed.delegate,
            holder: parsed.holder,

            metadata_url: parsed.metadata_url,
        };
    } catch (e) {
        Logger.error(e);
        return null;
    }
};

const collectionAccountDisc = 'RQLwA3YS2fI=';
export const parseNFTokenCollectionAccount = (account: Account): NftokenTypes.CollectionAccount | null => {
    if (!isNFTokenAccount(account)) {
        return null;
    }

    try {
        invariant(account.data.raw, 'isNFTokenAccount guarantees raw account data');

        if (!hasDiscriminator(account.data.raw, collectionAccountDisc)) {
            return null;
        }

        const parsed = NftokenTypes.collectionAccountDecoder.decode(account.data.raw);

        return {
            address: account.pubkey.toBase58(),
            authority: parsed.authority,
            authority_can_update: Boolean(parsed.authority_can_update),
            metadata_url: parsed.metadata_url,
        };
    } catch (e) {
        Logger.error(e);
        return null;
    }
};
