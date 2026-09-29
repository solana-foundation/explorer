import {
    BPF_LOADER_PROGRAM_LABEL,
    isParsedInstructionProgram,
    type KitInstruction,
    type ParsedInstructionInfo,
    type ParserProgramLabel,
} from '@explorer/parsers';
import {
    addDecoderSizePrefix,
    getBase64Decoder,
    getBytesDecoder,
    getStructDecoder,
    getU32Decoder,
    getU64Decoder,
} from '@solana/kit';
import type { ParsedInstruction } from '@solana/web3.js';
import { create } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import { FinalizeInfo, WriteInfo } from './types';

/** On-chain id of BPF Loader 2, the only loader the RPC pre-parses as `bpf-loader`. */
export const BPF_LOADER_PROGRAM_ADDRESS = 'BPFLoader2111111111111111111111111111111111';

/** RPC `parsed.program` discriminator for the program; also the slice's `programLabel`. */
export const BPF_LOADER_PARSER_LABEL = BPF_LOADER_PROGRAM_LABEL satisfies ParserProgramLabel;

/**
 * Canonical shape for a parsed BPF Loader 2 instruction. The type strings and `info` field
 * names are the RPC's, so the byte path maps onto them and both paths feed one card.
 */
export type BpfLoaderParsed =
    ParsedInstructionInfo<'write', WriteInfo> | ParsedInstructionInfo<'finalize', FinalizeInfo>;

// Bincode u32 discriminants of `LoaderInstruction` (agave loader-v2).
const WRITE_DISCRIMINANT = 0;
const FINALIZE_DISCRIMINANT = 1;

const discriminantDecoder = getU32Decoder();
const writeDataDecoder = getStructDecoder([
    ['discriminant', getU32Decoder()],
    ['offset', getU32Decoder()],
    ['bytes', addDecoderSizePrefix(getBytesDecoder(), getU64Decoder())],
]);

/**
 * Decode a raw BPF Loader 2 instruction (inspector path). Account positions mirror agave's
 * `parse_bpf_loader.rs`, so the inspector renders the same rows as the tx page.
 */
export function parseBpfLoaderKitInstruction(ix: KitInstruction): BpfLoaderParsed | undefined {
    try {
        const [account] = ix.accounts;
        switch (discriminantDecoder.decode(ix.data)) {
            case WRITE_DISCRIMINANT: {
                const { bytes, offset } = writeDataDecoder.decode(ix.data);
                return {
                    info: create(
                        { account: account.address, bytes: getBase64Decoder().decode(bytes), offset },
                        WriteInfo,
                    ),
                    type: 'write',
                };
            }
            case FINALIZE_DISCRIMINANT:
                // Agave rejects a finalize without its rent sysvar, even though only the first account is shown.
                if (ix.accounts.length < 2) return undefined;
                return { info: create({ account: account.address }, FinalizeInfo), type: 'finalize' };
            default:
                return undefined;
        }
    } catch {
        // Short data or a missing account; the dispatcher renders that as unknown.
        return undefined;
    }
}

/** Normalise an RPC-pre-parsed BPF Loader 2 instruction into `BpfLoaderParsed`. */
export function parseBpfLoaderRpcInstruction(ix: ParsedInstruction): BpfLoaderParsed | undefined {
    if (!isParsedInstructionProgram(ix, BPF_LOADER_PARSER_LABEL)) return undefined;
    try {
        switch (ix.parsed.type) {
            case 'write':
                return { info: create(ix.parsed.info, WriteInfo), type: 'write' };
            case 'finalize':
                return { info: create(ix.parsed.info, FinalizeInfo), type: 'finalize' };
            default:
                return undefined;
        }
    } catch (error) {
        // The program label already matched, so a validation failure here means the RPC sent a payload
        // we don't model — worth surfacing. Returning undefined falls back to the unknown-instruction card.
        Logger.error(error, { instructionType: ix.parsed.type, program: ix.program });
        return undefined;
    }
}
