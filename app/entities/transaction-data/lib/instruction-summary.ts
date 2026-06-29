import {
    ComputeBudgetProgram,
    ParsedInstruction,
    ParsedTransactionWithMeta,
    PartiallyDecodedInstruction,
} from '@solana/web3.js';
import { MEMO_PROGRAM_ADDRESS } from '@solana-program/memo';
import { camelToTitleCase } from '@utils/index';
import { ParsedInfo } from '@validators/index';
import bs58 from 'bs58';
import { is } from 'superstruct';

import { getProgramName } from './get-program-name';

// Program + discriminator are one field since they only ever travel together.
export type InstructionNameLookup = {
    programId: string;
    discriminator: Uint8Array;
};

export type InstructionSummary = {
    name: string;
    program: string;
    // Set only on the "Unknown Instruction" fallback — the hint a name resolver (IDL, ZK ElGamal, …)
    // uses to resolve the real name from the program + discriminator.
    nameLookup?: InstructionNameLookup;
};

export function getInstructionSummaries(transactionWithMeta: ParsedTransactionWithMeta): InstructionSummary[] {
    return (
        transactionWithMeta.transaction.message.instructions
            // Drop ComputeBudget: fee/priority boilerplate on nearly every tx that says nothing about what
            // it does. It has no IDL (it's in NON_ANCHOR_PROGRAMS), so keeping it would only add noisy
            // "Unknown Instruction" rows to every summary.
            .filter(ix => !ix.programId.equals(ComputeBudgetProgram.programId))
            .map(summarizeInstruction)
    );
}

// SPL Memo renders its instruction as the bare memo text (a string `parsed`) rather than a typed
// object, so it's matched by program id, not by that shape. v2 has a canonical export; v1 doesn't.
const MEMO_PROGRAM_IDS: ReadonlySet<string> = new Set([
    MEMO_PROGRAM_ADDRESS,
    'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo',
]);

// Discriminator hint length. Anchor discriminators are 8 bytes; a Codama discriminator is one or more
// contiguous constant fields and can be longer (two u64s = 16). Cap at 16 so the hint holds any realistic
// discriminator — matchInstructionName requires the data to be at least as long as the discriminator it
// compares — without retaining the full instruction payload.
const MAX_DISCRIMINATOR_BYTES = 16;

function summarizeInstruction(ix: ParsedInstruction | PartiallyDecodedInstruction): InstructionSummary {
    const program = getProgramName(ix.programId);

    if (!('parsed' in ix)) {
        // Normalize the bs58 Buffer to a Uint8Array, capped at the longest discriminator we might match.
        const discriminator = Uint8Array.from(bs58.decode(ix.data).subarray(0, MAX_DISCRIMINATOR_BYTES));
        return {
            name: 'Unknown Instruction',
            nameLookup: { discriminator, programId: ix.programId.toBase58() },
            program,
        };
    }

    if (is(ix.parsed, ParsedInfo)) {
        return { name: camelToTitleCase(ix.parsed.type), program };
    }
    if (MEMO_PROGRAM_IDS.has(ix.programId.toBase58())) return { name: 'Memo', program };
    // Parsed but neither a typed instruction nor a memo — no raw data for a discriminator lookup.
    return { name: 'Unknown Instruction', program };
}
