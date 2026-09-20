import type { KitInstruction, ParsedInstructionInfo, ParserProgramLabel } from '@explorer/parsers';
import type { Address } from '@solana/kit';
import type { ParsedInstruction } from '@solana/web3.js';
import { MEMO_PROGRAM_ADDRESS, parseAddMemoInstruction } from '@solana-program/memo';

export { MEMO_PROGRAM_ADDRESS };

/** The original SPL Memo deployment. The client only names v2, and the RPC parses both as `spl-memo`. */
export const MEMO_V1_PROGRAM_ADDRESS = 'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo' as Address;

/** RPC `parsed.program` discriminator for both Memo programs; also the slices' `programLabel`. */
export const MEMO_PROGRAM_LABEL = 'spl-memo' satisfies ParserProgramLabel;

/** A memo's whole instruction data is its UTF-8 text, so the payload is the decoded string itself. */
export type MemoParsed = ParsedInstructionInfo<'memo', string>;

export function parseMemoInstruction(ix: KitInstruction): MemoParsed {
    return { info: parseAddMemoInstruction(ix).data.memo, type: 'memo' };
}

/** The RPC hands a memo over as a bare string rather than a `{ type, info }` envelope. */
export function parseMemoRpcInstruction(ix: ParsedInstruction): MemoParsed | undefined {
    if (ix.program !== MEMO_PROGRAM_LABEL || typeof ix.parsed !== 'string') return undefined;
    return { info: ix.parsed, type: 'memo' };
}

export function isMemoParsed(parsed: unknown): parsed is MemoParsed {
    return (
        typeof parsed === 'object' &&
        parsed !== null &&
        'type' in parsed &&
        parsed.type === 'memo' &&
        'info' in parsed &&
        typeof parsed.info === 'string'
    );
}
