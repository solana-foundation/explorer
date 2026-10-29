import {
    type Address,
    type Base58EncodedBytes,
    createSolanaRpc,
    getBase58Decoder,
    getBase64Encoder,
} from '@solana/kit';

import { CLAIM_SCHEDULE_BUCKET_V2_KEY, GENESIS_PROGRAM_ADDRESS, LOCK_MINT_OFFSET } from '../lib/constants';

export type VestingLockAccount = { address: Address; data: Uint8Array };

/**
 * Fetches every `ClaimScheduleBucketV2` of a mint in one filtered `getProgramAccounts` call. Returns raw bytes:
 * vested amounts grow with time, so callers evaluate them with `readVestingLock` at render time.
 */
export async function fetchVestingLocks(url: string, mint: Address): Promise<VestingLockAccount[]> {
    const accounts = await createSolanaRpc(url)
        .getProgramAccounts(GENESIS_PROGRAM_ADDRESS, {
            encoding: 'base64',
            filters: [
                { memcmp: { bytes: KEY_BASE58, encoding: 'base58', offset: 0n } },
                {
                    memcmp: {
                        bytes: mint as string as Base58EncodedBytes,
                        encoding: 'base58',
                        offset: BigInt(LOCK_MINT_OFFSET),
                    },
                },
            ],
        })
        .send();

    const base64 = getBase64Encoder();
    return accounts.map(({ pubkey, account }) => ({
        address: pubkey,
        data: new Uint8Array(base64.encode(account.data[0])),
    }));
}

const KEY_BASE58 = getBase58Decoder().decode(new Uint8Array([CLAIM_SCHEDULE_BUCKET_V2_KEY])) as Base58EncodedBytes;
