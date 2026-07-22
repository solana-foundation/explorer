import type { ParsedInstruction, PublicKey, TransactionInstruction } from '@solana/web3.js';

import type { KitInstruction } from '@/app/shared/lib/web3js-compat';

/**
 * The set of `programLabel` values a decoder slice (`InstructionParser`) may
 * declare. For programs the RPC pre-parses this is the RPC `parsed.program`
 * discriminator used to guard `fromParsed` (e.g. `'spl-token'`); for programs
 * the RPC does not pre-parse (MPL Token Metadata) it is a stable synthetic
 * label carried in `UnparsedInstruction` for program-aware fallback cards.
 *
 * The two token labels intentionally mirror `TokenProgram` in
 * `app/utils/programs.ts`. They are inlined here rather than imported so this
 * entity carries no dependency on pre-FSD utils; they are RPC-stable strings,
 * so the small duplication is safe. Adding a slice for a new program extends
 * this union, so a slice that declares a label not listed here fails to
 * compile — keeping slice labels and the RPC guards they are compared against
 * from drifting.
 */
export type ParserProgramLabel =
    | 'bpf-upgradeable-loader'
    | 'lighthouse'
    | 'mpl-token-metadata'
    | 'spl-associated-token-account'
    // 'spl-token' | 'spl-token-2022' mirror `TokenProgram` (see note above).
    | 'spl-token'
    | 'spl-token-2022'
    | 'system';

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
