import {
    type Address,
    getAddressCodec,
    getLiteralUnionCodec,
    getStructCodec,
    getU64Codec,
    type ReadonlyUint8Array,
} from '@solana/kit';

import { err, ok, type Result } from '../shared/result.js';

// Status discriminators are positional, so this order is the wire format (solana-loader-v4-interface).
const STATUS_BY_VALUE = ['retracted', 'deployed', 'finalized'] as const;

// LoaderV4State header (solana-loader-v4-interface); the ELF follows it.
function getLoaderV4StateHeaderCodec() {
    return getStructCodec([
        ['slot', getU64Codec()],
        ['authority', getAddressCodec()],
        ['status', getLiteralUnionCodec(STATUS_BY_VALUE, { size: getU64Codec() })],
    ]);
}

export type LoaderV4Status = (typeof STATUS_BY_VALUE)[number];

export type LoaderV4State = {
    /** When finalized this is the next-version forwarding address, not a signing authority. */
    authority: string;
    /** Slot of the last deploy, retract or initialize — not necessarily a deploy. */
    slot: bigint;
    status: LoaderV4Status;
};

export function decodeLoaderV4State(bytes: ReadonlyUint8Array | null | undefined): Result<LoaderV4State> {
    const codec = getLoaderV4StateHeaderCodec();
    if (!bytes || bytes.length < codec.fixedSize) {
        return err(new Error('loader-v4 account data shorter than the state header'));
    }

    try {
        return ok(codec.decode(bytes));
    } catch (cause) {
        // Past the length guard the status discriminator is the only field that can fail to decode.
        return err(new Error('unknown loader-v4 status value', { cause }));
    }
}

/** The ELF past the state header; empty for a header-only account. */
export function loaderV4ProgramBytes(bytes: ReadonlyUint8Array): ReadonlyUint8Array {
    return bytes.subarray(getLoaderV4StateHeaderCodec().fixedSize);
}

/** Encodes the header alone; callers append the ELF bytes. */
export function encodeLoaderV4StateHeader(header: {
    authority: Address;
    slot: bigint;
    status: LoaderV4Status;
}): ReadonlyUint8Array {
    return getLoaderV4StateHeaderCodec().encode(header);
}

/** Finalized repurposes the header field as a next-version pointer — no signer remains. */
export function loaderV4SigningAuthority(state: LoaderV4State): string | null {
    return state.status === 'finalized' ? null : state.authority;
}
