import { PmpDecodeConfigStruct } from '@entities/pmp-account/@x/pmp-instruction';
import { unwrapOption } from '@solana/kit';
import {
    getInitializeInstructionDataDecoder,
    getSetDataInstructionDataDecoder,
    getWriteInstructionDataDecoder,
    identifyProgramMetadataInstruction,
    ProgramMetadataInstruction,
} from '@solana-program/program-metadata';
import { is } from 'superstruct';

import { bytes } from '@/app/shared/lib/bytes';

import { HEADER_ONLY_SET_DATA_LEN } from './constants';
import type { PmpInstructionData } from './types';

/**
 * Decodes the config and payload of a content-carrying PMP instruction from its RAW bytes, using the library's
 * typed decoders. Needs no IDL, because those decoders ship with the installed package.
 *
 * Takes bytes rather than a `TransactionInstruction`, so both the transaction page and a `getTransaction` response
 * can feed it without either one converting into the other's shape.
 *
 * Returns undefined for the six housekeeping instructions and for any shape the decoders reject, so a caller falls
 * through to its remaining tiers exactly as it does today.
 */
export function decodePmpInstructionData(data: Uint8Array): PmpInstructionData | undefined {
    try {
        switch (identifyProgramMetadataInstruction(data)) {
            case ProgramMetadataInstruction.SetData:
                return decodeSetData(data);
            case ProgramMetadataInstruction.Initialize:
                return decodeInitialize(data);
            case ProgramMetadataInstruction.Write:
                return decodeWrite(data);
            default:
                // allocate, setAuthority, setImmutable, trim, extend, close carry no payload.
                return undefined;
        }
    } catch {
        // Three shapes land here:
        // - an unknown or empty discriminator (identify throws)
        // - a truncated body,
        // - an out-of-range enum byte ("Enum discriminator out of range").
        return undefined;
    }
}

function decodeSetData(data: Uint8Array): PmpInstructionData | undefined {
    // setData carries `dataSource` as an OPTIONAL trailing byte, so a 4-byte instruction is the header-only hint
    // update and `getSetDataInstructionDataDecoder()` throws on it. Branch on the length before decoding.
    if (data.length === HEADER_ONLY_SET_DATA_LEN) {
        const [, encoding, compression, format] = data;
        const config = { compression, encoding, format };

        return is(config, PmpDecodeConfigStruct) ? { config, kind: 'setData' } : undefined;
    }

    const decoded = getSetDataInstructionDataDecoder().decode(data);
    return {
        config: { compression: decoded.compression, encoding: decoded.encoding, format: decoded.format },
        dataSource: decoded.dataSource,
        kind: 'setData',
        payload: toPayload(unwrapOption(decoded.data)),
    };
}

function decodeInitialize(data: Uint8Array): PmpInstructionData {
    const decoded = getInitializeInstructionDataDecoder().decode(data);
    return {
        config: { compression: decoded.compression, encoding: decoded.encoding, format: decoded.format },
        dataSource: decoded.dataSource,
        kind: 'initialize',
        payload: toPayload(unwrapOption(decoded.data)),
        seed: decoded.seed,
    };
}

function decodeWrite(data: Uint8Array): PmpInstructionData {
    const decoded = getWriteInstructionDataDecoder().decode(data);
    return { chunk: toPayload(unwrapOption(decoded.data)), kind: 'write', offset: decoded.offset };
}

function toPayload(value: unknown): Uint8Array | undefined {
    if (!(value instanceof Uint8Array) || value.length === 0) return undefined;
    return bytes(value);
}
