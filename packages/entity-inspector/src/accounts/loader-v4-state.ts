import { getAddressDecoder, getU64Decoder, type ReadonlyUint8Array } from '@solana/kit';

import { asSafeNumeric } from '../shared/parse-helpers.js';
import { err, ok, type Result } from '../shared/result.js';
import type { SafeNumeric } from '../shared/types.js';

// LoaderV4State header layout (solana-loader-v4-interface): slot u64 LE, authority pubkey, status u64 LE; the ELF follows.
export const LOADER_V4_PROGRAM_DATA_OFFSET = 48;

const STATUS_BY_VALUE = ['retracted', 'deployed', 'finalized'] as const;

export type LoaderV4Status = (typeof STATUS_BY_VALUE)[number];

export type LoaderV4State = {
    /** When finalized this is the next-version forwarding address, not a signing authority. */
    authority: string;
    /** Slot of the last deploy, retract or initialize — not necessarily a deploy. */
    slot: SafeNumeric;
    status: LoaderV4Status;
};

export function decodeLoaderV4State(bytes: ReadonlyUint8Array | null | undefined): Result<LoaderV4State> {
    if (!bytes || bytes.length < LOADER_V4_PROGRAM_DATA_OFFSET) {
        return err(new Error('loader-v4 account data shorter than the state header'));
    }

    const statusValue = getU64Decoder().decode(bytes, 40);
    const status = statusValue <= 2n ? STATUS_BY_VALUE[Number(statusValue)] : undefined;
    if (!status) {
        return err(new Error(`unknown loader-v4 status value: ${statusValue}`));
    }
    return ok({
        authority: getAddressDecoder().decode(bytes, 8),
        slot: asSafeNumeric(getU64Decoder().decode(bytes, 0)),
        status,
    });
}

/** Finalized repurposes the header field as a next-version pointer — no signer remains. */
export function loaderV4SigningAuthority(state: LoaderV4State): string | null {
    return state.status === 'finalized' ? null : state.authority;
}
