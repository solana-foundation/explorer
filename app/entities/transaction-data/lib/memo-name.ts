import { SUPPORTED_MEMO_PROGRAM_ADDRESSES } from '@solana-program/memo';

import type { InstructionNameLookup } from './types';

const MEMO_PROGRAM_IDS: ReadonlySet<string> = new Set(SUPPORTED_MEMO_PROGRAM_ADDRESSES);

/**
 * `'Memo'` for any SPL Memo deployment, or undefined for any other program.
 *
 * The one name source that reads no bytes: a memo's whole instruction data *is* the UTF-8 text, so there
 * is no discriminator and the program id alone decides. Taking only `programId` is what lets both
 * stage-1 entry points call this — an RPC-parsed instruction carries no `data` at all — so the parsed
 * and raw paths cannot drift into naming a memo differently.
 * @param lookup - The program id; a memo needs nothing else
 */
export function resolveMemoInstructionName({
    programId,
}: Pick<InstructionNameLookup, 'programId'>): string | undefined {
    return MEMO_PROGRAM_IDS.has(programId) ? 'Memo' : undefined;
}
