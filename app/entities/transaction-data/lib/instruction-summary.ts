import { getBase58Encoder, type ReadonlyUint8Array } from '@solana/kit';
import { ComputeBudgetProgram, ParsedInstruction, PartiallyDecodedInstruction, type PublicKey } from '@solana/web3.js';
import { camelToTitleCase } from '@utils/index';
import { ParsedInfo } from '@validators/index';
import { is } from 'superstruct';

import type { TransactionWithMeta } from '../model/types';
import { findProgramName, UNKNOWN_PROGRAM_NAME } from './get-program-name';
import { resolveMemoInstructionName } from './memo-name';
import type { InstructionNames, InstructionSummary } from './types';

const BASE58_ENCODER = getBase58Encoder();

export const UNKNOWN_INSTRUCTION_NAME = 'Unknown Instruction';

export function getInstructionSummaries(transactionWithMeta: TransactionWithMeta): InstructionSummary[] {
    return (
        transactionWithMeta.transaction.message.instructions
            // Drop ComputeBudget: fee/priority boilerplate on nearly every tx that says nothing about what
            // it does. The CU chart keeps it, because dropping a row there would misalign every later
            // instruction against its logged CU figure.
            .filter(ix => !ix.programId.equals(ComputeBudgetProgram.programId))
            .map(summarizeInstruction)
    );
}

// Discriminator lookup length. The longest any source reads today is 8 (Anchor); the IDL table's Codama
// path tops out at 4, since it resolves only a single constant int field at offset 0. Cap at 16 for
// headroom without retaining the full instruction payload.
// A ceiling, not a guarantee: an IDL declaring a discriminator longer than 16 bytes is truncated here and
// can never match, because the comparison requires the data to be at least as long as the discriminator.
const MAX_DISCRIMINATOR_BYTES = 16;

/**
 * The names one instruction resolves to from the transaction alone — no IDL fetch. Returns the raw
 * program + data lookup instead of a name whenever only a resolver can name the instruction.
 */
export function resolveInstructionNames(ix: ParsedInstruction | PartiallyDecodedInstruction): InstructionNames {
    if (!('parsed' in ix)) {
        // A partially decoded instruction carries its data as base58, so encoding it yields the bytes.
        return resolveNamesFromData({ data: BASE58_ENCODER.encode(ix.data), programId: ix.programId });
    }

    const programName = findProgramName(ix.programId);
    if (is(ix.parsed, ParsedInfo)) {
        return { name: camelToTitleCase(ix.parsed.type), programName };
    }
    // The RPC renders a memo as its bare text rather than a typed object, so it is matched by program id.
    // Same call as the NAME_SOURCES entry, so parsed and raw memos cannot be named differently.
    const memoName = resolveMemoInstructionName({ programId: ix.programId.toBase58() });
    if (memoName !== undefined) return { name: memoName, programName };
    // Parsed but neither a typed instruction nor a memo — no raw data for a discriminator lookup, so
    // nothing can name it and there is no lookup to hand on either.
    return { name: undefined, programName };
}

/**
 * The names a raw instruction resolves to from its program and data alone — no IDL fetch. The entry
 * point for callers holding decoded bytes (a compiled message, e.g. a simulation) rather than an
 * RPC-parsed instruction. Compiled bytes carry no `parsed.type` to read a name from.
 * @param programId - The instruction's program
 * @param data - The raw instruction data
 */
export function resolveNamesFromData({
    programId,
    data,
}: {
    programId: PublicKey;
    data: ReadonlyUint8Array;
}): InstructionNames {
    // Every byte-level resolver is a NAME_SOURCES entry, so nothing is named here — the lookup always
    // goes out for a source to try. See InstructionNames.
    return {
        name: undefined,
        nameLookup: { data: data.slice(0, MAX_DISCRIMINATOR_BYTES), programId: programId.toBase58() },
        programName: findProgramName(programId),
    };
}

function summarizeInstruction(ix: ParsedInstruction | PartiallyDecodedInstruction): InstructionSummary {
    const { name, programName, nameLookup } = resolveInstructionNames(ix);

    return {
        name: name ?? UNKNOWN_INSTRUCTION_NAME,
        programName: programName ?? UNKNOWN_PROGRAM_NAME,
        ...(nameLookup ? { nameLookup } : {}),
    };
}
