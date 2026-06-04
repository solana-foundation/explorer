import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import { toParsedInstruction } from './compat';
import type { InstructionParser, InstructionParserDispatcher } from './types';

/**
 * Build a dispatcher that routes TransactionInstructions and pre-parsed
 * ParsedInstructions through their per-program slice and produces the
 * canonical ParsedInstruction shape that cards consume. Both entry points
 * pass through the slice's `SliceParsed` shape and are wrapped back into
 * ParsedInstruction via `toParsedInstruction` (transitional compat — Phase 5
 * deletes the wrap when cards consume `SliceParsed` directly).
 *
 * No global state: each call site composes its own dispatcher with exactly
 * the parsers it needs. Throws on duplicate `programId` so misconfiguration
 * fails loudly at startup.
 */
export function createInstructionParserDispatcher(parsers: readonly InstructionParser[]): InstructionParserDispatcher {
    const byProgramId = new Map<string, InstructionParser>();
    for (const parser of parsers) {
        const existing = byProgramId.get(parser.programId);
        if (existing) {
            throw new Error(
                `instruction-parser: duplicate parser for ${parser.programId} ` +
                    `(${existing.programLabel} vs ${parser.programLabel})`,
            );
        }
        byProgramId.set(parser.programId, parser);
    }

    return {
        canHandle(programId) {
            return byProgramId.has(programId);
        },
        fromParsedInstruction(ix) {
            const parser = byProgramId.get(ix.programId.toBase58());
            // No slice registered, or slice doesn't implement fromParsed (RPC
            // produced this but we don't normalise it) — pass through unchanged.
            if (!parser?.fromParsed) {
                return ix;
            }
            const sliceParsed = parser.fromParsed(ix);
            if (!sliceParsed) {
                // Slice rejected the input (e.g. unknown instruction type).
                // Fall back to RPC's view so the tx page still renders.
                return ix;
            }
            return toParsedInstruction(sliceParsed, parser.programLabel, ix.programId);
        },
        fromTransactionInstruction(ix) {
            const parser = byProgramId.get(ix.programId.toBase58());
            if (!parser) {
                return undefined;
            }
            // Legacy -> kit conversion happens once per dispatch.
            const sliceParsed = parser.fromTransaction(toKitInstruction(ix));
            if (!sliceParsed) {
                return { programId: ix.programId, programLabel: parser.programLabel, unknown: true };
            }
            return toParsedInstruction(sliceParsed, parser.programLabel, ix.programId);
        },
        getInstructionParser(programId) {
            return byProgramId.get(programId);
        },
    };
}
