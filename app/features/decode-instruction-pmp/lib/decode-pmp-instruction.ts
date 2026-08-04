import { unwrapOption } from '@solana/kit';
import type { TransactionInstruction } from '@solana/web3.js';
import {
    getInitializeInstructionDataDecoder,
    getSetDataInstructionDataDecoder,
    getWriteInstructionDataDecoder,
    identifyProgramMetadataInstruction,
    ProgramMetadataInstruction,
} from '@solana-program/program-metadata';
import { is } from 'superstruct';

import { HEADER_ONLY_SET_DATA_LEN, PMP_ADDRESS, PMP_OPTIONAL_BUFFER_ACCOUNT_INDEX } from './constants';
import type { PmpContentInstruction } from './types';
import { PmpDecodeConfigStruct } from './validators';

/**
 * Decodes the config and payload of a content-carrying PMP instruction from its RAW bytes, using the library's
 * typed decoders. Needs no IDL, because those decoders ship with the installed package.
 *
 * Returns undefined for the six housekeeping instructions and for any shape the decoders reject, so the caller
 * falls through to its remaining tiers (the dynamic IDL card, then Unknown) exactly as it does today.
 */
export function decodePmpContentInstruction(ix: TransactionInstruction): PmpContentInstruction | undefined {
    try {
        switch (identifyProgramMetadataInstruction(ix.data)) {
            case ProgramMetadataInstruction.SetData:
                return decodeSetData(ix);
            case ProgramMetadataInstruction.Initialize:
                return decodeInitialize(ix);
            case ProgramMetadataInstruction.Write:
                return decodeWrite(ix);
            default:
                // allocate, setAuthority, setImmutable, trim, extend, close carry no payload.
                return undefined;
        }
    } catch {
        // Three shapes land here:
        // - an unknown or empty discriminator (identify throws)
        // - a truncated body,
        // - an out-of-range enum byte ("Enum discriminator out of range").
        // All fall through to the IDL tier and then to Unknown.
        return undefined;
    }
}

function decodeSetData(ix: TransactionInstruction): PmpContentInstruction | undefined {
    // setData carries `dataSource` as an OPTIONAL trailing byte, so a 4-byte instruction is the header-only hint
    // update and `getSetDataInstructionDataDecoder()` throws on it. Branch on the length before decoding.
    if (ix.data.length === HEADER_ONLY_SET_DATA_LEN) {
        const [, encoding, compression, format] = ix.data;
        const config = { compression, encoding, format };
        // These are the slice's only unvalidated bytes, so superstruct narrows them to the library enums rather
        // than an `as` cast asserting a range nothing checked. An out-of-range hint then falls through like every
        // other malformed shape, instead of reaching the card as a number no label map can resolve.
        return is(config, PmpDecodeConfigStruct) ? { config, kind: 'setData' } : undefined;
    }

    const decoded = getSetDataInstructionDataDecoder().decode(ix.data);
    const payload = toPayload(unwrapOption(decoded.data));
    return {
        config: { compression: decoded.compression, encoding: decoded.encoding, format: decoded.format },
        dataSource: decoded.dataSource,
        kind: 'setData',
        payload,
        // A 5-byte setData with `buffer == programId` is InvalidInstructionData on chain, so "no payload plus a
        // foreign buffer at index 2" is the only reachable buffer-sourced shape.
        sourceBuffer: payload ? undefined : sourceBufferAt(ix),
    };
}

function decodeInitialize(ix: TransactionInstruction): PmpContentInstruction {
    // `initialize`'s `dataSource` is a fixed struct field, so its decoder always applies - no length branch.
    const decoded = getInitializeInstructionDataDecoder().decode(ix.data);
    return {
        config: { compression: decoded.compression, encoding: decoded.encoding, format: decoded.format },
        dataSource: decoded.dataSource,
        kind: 'initialize',
        // The in-place path finalises bytes already written to the metadata PDA at account index 0.
        metadataAccount: ix.keys[0]?.pubkey.toBase58(),
        payload: toPayload(unwrapOption(decoded.data)),
        seed: decoded.seed,
    };
}

function decodeWrite(ix: TransactionInstruction): PmpContentInstruction {
    const { data, offset } = getWriteInstructionDataDecoder().decode(ix.data);
    const chunk = toPayload(unwrapOption(data));
    return {
        chunk,
        kind: 'write',
        offset,
        sourceBuffer: chunk ? undefined : sourceBufferAt(ix),
    };
}

/**
 * `unwrapOption` returns null for None, and the `data` field is a REMAINDER option, so none() and some(empty)
 * encode to the same bytes. Both collapse to "no payload here" - account index 2 is what tells a source-buffer
 * copy apart from a zero-length inline write.
 *
 * `TransactionInstruction.data` is a Node `Buffer`, so the remainder slice the decoder hands back is a Buffer
 * VIEW, not a plain `Uint8Array`. Copy it into one: the declared type says `Uint8Array`, the repo is migrating
 * off `Buffer`, and `Buffer` carries its own `toJSON`, which would change how a payload serialises downstream.
 * Copied rather than re-viewed because a Buffer view sits at a non-zero offset into Node's shared allocation
 * pool, which leaks that offset (and the whole pool's lifetime) into everything downstream. Inline payloads are
 * transaction-size bounded, so the copy is at most ~1 KB.
 */
function toPayload(value: unknown): Uint8Array | undefined {
    if (!(value instanceof Uint8Array) || value.length === 0) return undefined;
    return new Uint8Array(value);
}

/** The optional buffer/sourceBuffer slot. Codama's "programId" strategy fills an omitted optional with the id. */
function sourceBufferAt(ix: TransactionInstruction): string | undefined {
    const account = ix.keys[PMP_OPTIONAL_BUFFER_ACCOUNT_INDEX]?.pubkey.toBase58();
    return account && account !== PMP_ADDRESS ? account : undefined;
}
