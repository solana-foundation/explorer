import type { ParsedInstruction, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { toParsedInstruction } from './compat/to-parsed.js';
import { toKitInstruction } from './compat/web3js.js';
import type { KitInstruction } from './kit-instruction.js';
import type { ParserProgramLabel } from './program-registry.js';

export interface ParsedInstructionInfo<T extends string = string, I = unknown> {
    type: T;
    info: I;
}

/**
 * Parser is registered for the program but couldn't decode the discriminator.
 * Callers can branch on `programLabel` to render a program-aware fallback
 * (e.g. MPL's "Unknown Instruction" card) instead of the generic Unknown.
 *
 * Named as a sibling of `ParsedInstruction` so `DispatchResult` reads as two
 * parallel outcomes of the same decode attempt, not two unrelated shapes.
 */
export interface UnparsedInstruction {
    unknown: true;
    programLabel: ParserProgramLabel;
    programId: PublicKey;
}

export type DispatchResult = ParsedInstruction | UnparsedInstruction;

export function isParsedInstruction(result: DispatchResult | undefined): result is ParsedInstruction {
    return result !== undefined && !('unknown' in result);
}

/**
 * `P` is the slice's canonical shape — usually a discriminated union like
 * `{ type: 'transfer'; info: TransferInfo } | { type: 'createAccount'; info: ... }`
 * so consumers get exhaustive narrowing via `switch (parsed.type)`.
 */
export interface InstructionParser<P extends ParsedInstructionInfo = ParsedInstructionInfo> {
    programId: string;
    /**
     * For RPC-pre-parsed programs, the RPC `parsed.program` discriminator used
     * to guard `fromParsed` (e.g. 'system', 'spl-token'). For programs the RPC
     * does not pre-parse, a stable synthetic label. Typed against
     * `ParserProgramLabel` so a slice and its RPC guard cannot silently drift.
     */
    programLabel: ParserProgramLabel;
    /** Takes KitInstruction (not TransactionInstruction) — dispatcher converts once at its entry. */
    fromTransaction(ix: KitInstruction): P | undefined;
    /** Omit for programs RPC does not pre-parse. */
    fromParsed?(ix: ParsedInstruction): P | undefined;
}

export interface InstructionParserDispatcher {
    /**
     * Cheap, parse-free check: is a slice registered for this `programId`?
     * Because every slice implements `fromTransaction` (only `fromParsed` is
     * optional), `true` means the byte path can decode this program. This is a
     * pure registration lookup — it does NOT run the parser, so it cannot
     * disagree with what `fromTransaction`/`fromParsed` actually accept (no
     * second source of truth to drift). To test the RPC path specifically,
     * inspect `getInstructionParser(programId)?.fromParsed`.
     */
    canHandle(programId: string): boolean;
    /** `undefined` → no parser registered. `UnparsedInstruction` → registered but discriminator failed. */
    fromTransactionInstruction(ix: TransactionInstruction): DispatchResult | undefined;
    /** Passes through unchanged when no slice handles the program. */
    fromParsedInstruction(ix: ParsedInstruction): ParsedInstruction;
    getInstructionParser(programId: string): InstructionParser | undefined;
}

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
                return {
                    programId: ix.programId,
                    programLabel: parser.programLabel,
                    unknown: true,
                };
            }
            return toParsedInstruction(sliceParsed, parser.programLabel, ix.programId);
        },
        getInstructionParser(programId) {
            return byProgramId.get(programId);
        },
    };
}
