import { CreateIdempotentInfo, RecoverNestedInfo } from '@components/instruction/associated-token/types';
import { type ParsedInstruction } from '@solana/web3.js';
import {
    AssociatedTokenInstruction,
    CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR,
    identifyAssociatedTokenInstruction,
    parseCreateAssociatedTokenIdempotentInstruction,
    parseCreateAssociatedTokenInstruction,
    parseRecoverNestedAssociatedTokenInstruction,
} from '@solana-program/token';
import { create } from 'superstruct';

import { bytes } from '@/app/shared/lib/bytes';
import type { KitInstruction } from '@/app/shared/lib/web3js-compat';
import type { ParserProgramLabel } from '@/app/utils/programs';

/** RPC `parsed.program` discriminator for the Associated Token program; also the slice's `programLabel`. */
export const ASSOCIATED_TOKEN_PROGRAM_LABEL = 'spl-associated-token-account' satisfies ParserProgramLabel;

/**
 * Canonical shape for a parsed Associated Token instruction. `info` is left
 * loosely typed because the underlying `@solana-program/token` parsers
 * publish kit-shape objects that the AT DetailsCard doesn't currently consume
 * directly — it consumes the RPC-style `*Info` shapes for createIdempotent/
 * recoverNested, and the raw kit object for `create`. The `info: unknown`
 * leaves room for both during the transitional period.
 */
export type AssociatedTokenParsed =
    | { type: 'create'; info: unknown }
    | { type: 'createIdempotent'; info: unknown }
    | { type: 'recoverNested'; info: unknown };

export function parseAssociatedTokenInstruction(ix: KitInstruction): AssociatedTokenParsed | undefined {
    try {
        const data = effectiveInstructionData(ix.data);
        const idata = { ...ix, data };
        const instructionType = identifyAssociatedTokenInstruction(data);

        switch (instructionType) {
            case AssociatedTokenInstruction.CreateAssociatedToken:
                return { info: parseCreateAssociatedTokenInstruction(idata), type: 'create' };
            case AssociatedTokenInstruction.CreateAssociatedTokenIdempotent:
                return { info: parseCreateAssociatedTokenIdempotentInstruction(idata), type: 'createIdempotent' };
            case AssociatedTokenInstruction.RecoverNestedAssociatedToken:
                return { info: parseRecoverNestedAssociatedTokenInstruction(idata), type: 'recoverNested' };
            default:
                return undefined;
        }
    } catch {
        return undefined;
    }
}

/**
 * Normalise an RPC-pre-parsed AT instruction. The AT DetailsCard's `create`
 * branch doesn't apply a superstruct validator (it relies on the raw kit
 * shape), so for `create` we pass `info` through unchanged. The idempotent
 * and recover-nested branches validate.
 */
export function parseAssociatedTokenRpcInstruction(ix: ParsedInstruction): AssociatedTokenParsed | undefined {
    if (ix.program !== ASSOCIATED_TOKEN_PROGRAM_LABEL) return undefined;
    try {
        switch (ix.parsed.type) {
            case 'create':
                return { info: ix.parsed.info, type: 'create' };
            case 'createIdempotent':
                return { info: create(ix.parsed.info, CreateIdempotentInfo), type: 'createIdempotent' };
            case 'recoverNested':
                return { info: create(ix.parsed.info, RecoverNestedInfo), type: 'recoverNested' };
            default:
                return undefined;
        }
    } catch {
        return undefined;
    }
}

/**
 * Some clients send the AT Create instruction with empty data instead of the
 * single-byte discriminator. Reconstruct the canonical discriminator byte so
 * `identifyAssociatedTokenInstruction` can recognise it. The original data is
 * left untouched.
 */
function effectiveInstructionData(data: Uint8Array): Uint8Array {
    if (data.length === 0) {
        return bytes([CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR]);
    }
    return data;
}
