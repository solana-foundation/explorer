import {
    decodeNftokenCollectionAccount,
    decodeNftokenNftAccount,
    NFTOKEN_ADDRESS,
    type NftokenCollectionAccount,
    type NftokenNftAccount,
} from '@explorer/decoder-nftoken';
import { type ReadonlyUint8Array } from '@solana/kit';

import { Logger } from '@/app/shared/lib/logger';

import { Account } from '../../../providers/accounts';

export function isNFTokenAccount(account: Account): boolean {
    return Boolean(account.owner.toBase58() === NFTOKEN_ADDRESS && account.data.raw);
}

export const parseNFTokenNFTAccount = (account: Account): NftokenNftAccount | null =>
    decodeNFTokenAccount(account, decodeNftokenNftAccount);

export const parseNFTokenCollectionAccount = (account: Account): NftokenCollectionAccount | null =>
    decodeNFTokenAccount(account, decodeNftokenCollectionAccount);

/**
 * Runs one of the package's decoders over an account's raw data, reporting malformed data rather than
 * surfacing it. A `null` means the account is not NFToken's, is not the kind the decoder reads, or did
 * not decode.
 */
function decodeNFTokenAccount<T>(
    account: Account,
    decode: (accountAddress: string, data: ReadonlyUint8Array) => T | undefined,
): T | null {
    const raw = account.data.raw;
    if (!raw || account.owner.toBase58() !== NFTOKEN_ADDRESS) {
        return null;
    }

    try {
        return decode(account.pubkey.toBase58(), raw) ?? null;
    } catch (e) {
        Logger.error(e);
        return null;
    }
}
