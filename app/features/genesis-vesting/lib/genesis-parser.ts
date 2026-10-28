import { getGenesisInstructionName } from '@entities/genesis';
import type { KitInstruction, ParsedInstructionInfo, ParserProgramLabel } from '@explorer/parsers';

import { Logger } from '@/app/shared/lib/logger';

/** The RPC never pre-parses Genesis, so this is a synthetic label carried through the dispatcher. */
export const GENESIS_PROGRAM_LABEL = 'genesis' satisfies ParserProgramLabel;

/** Genesis is decoded by name only: `type` is the IDL instruction name and there is no payload. */
export type GenesisParsed = ParsedInstructionInfo<string, Record<string, never>>;

/**
 * Resolves a raw Genesis instruction to its IDL name. Returns `undefined` for empty data or an unknown
 * discriminator, so the dispatcher emits an `UnparsedInstruction` and the card titles it "Unknown".
 */
export function parseGenesisInstruction(ix: KitInstruction): GenesisParsed | undefined {
    const discriminator = ix.data?.[0];
    if (discriminator === undefined) return undefined;

    const name = getGenesisInstructionName(discriminator);
    if (name === undefined) {
        // An unknown discriminator means the program shipped instructions after the vendored IDL.
        Logger.error(new Error(`Unknown Genesis instruction discriminator ${discriminator}`), {
            programId: ix.programAddress,
        });
        return undefined;
    }
    return { info: {}, type: name };
}
