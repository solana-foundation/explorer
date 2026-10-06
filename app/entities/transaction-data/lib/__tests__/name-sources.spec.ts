import { type ProgramIdlNames } from '@entities/idl/@x/transaction-data';
import { LIGHTHOUSE_PROGRAM_ADDRESS } from 'lighthouse-sdk';

import { UNKNOWN_PROGRAM_NAME } from '../get-program-name';
import { UNKNOWN_INSTRUCTION_NAME } from '../instruction-summary';
import { applyNameSources, applyNameSourcesToSummaries, resolveNamesFromLookup } from '../name-sources';
import { type InstructionNameLookup, type InstructionNames, type InstructionSummary } from '../types';

describe('resolveNamesFromLookup', () => {
    describe('positive cases: a source names the instruction', () => {
        it('should resolve from the IDL name table', () => {
            const names = resolveNamesFromLookup(
                lookup('Prog1', 1),
                idlNames({ Prog1: { programName: 'Voting', resolveInstructionName: () => 'Vote' } }),
            );

            expect(names).toEqual({ name: 'Vote', programName: 'Voting' });
        });

        // The programs below ship no fetchable IDL, so a built-in source must name them with an empty map.
        it.each([
            // discriminator 2 = Set Compute Unit Limit
            ['Compute Budget', [COMPUTE_BUDGET_PROGRAM, 2, 0x40, 0x0d, 0x03, 0x00], 'Set Compute Unit Limit'],
            // The raw-bytes counterpart of the memo branch in `resolveInstructionNames`. Without it a
            // simulated memo stays unnamed while an RPC-parsed one reads "Memo".
            ['Memo', [MEMO_PROGRAM, 0x67, 0x6d], 'Memo'],
            // discriminator 3 = Verify Ciphertext-Commitment Equality
            ['ZK ElGamal', [ZK_PROGRAM, 3], 'Verify Ciphertext-Commitment Equality'],
            // discriminator 15 = Assert Sysvar Clock
            ['Lighthouse', [LIGHTHOUSE_PROGRAM_ADDRESS, 15], 'Assert Sysvar Clock'],
            // Serum reads a u32 instruction code after a 1-byte version prefix; code 1 = New Order.
            ['Serum', [SERUM_PROGRAM, 0, 1, 0, 0, 0], 'New Order'],
            // Pyth reads a u32 index after a u32 version; version 2, index 7 = Update Price.
            ['Pyth', [PYTH_PROGRAM, 2, 0, 0, 0, 7, 0, 0, 0], 'Update Price'],
            // The generated `@solana-program/*` clients are the only thing that names a simulated System or
            // Token instruction, which is half of what the CU chart needs. Covered here and not just in
            // program-client-name.spec, so removing the source from the chain fails a test.
            // discriminator 12 = transferChecked
            ['Token', [TOKEN_PROGRAM, 12], 'Transfer Checked'],
            // discriminator 2 (4-byte little-endian) = transfer
            ['System', [SYSTEM_PROGRAM, 2, 0, 0, 0], 'Transfer'],
            // Mango is the one chain member with no other case here, so without this, deleting it from
            // NAME_SOURCES fails nothing. Mango keys its instructions by a leading u32 LE discriminator; 2 = Deposit.
            ['Mango', [MANGO_PROGRAM, 2, 0, 0, 0], 'Deposit'],
        ] as const)('should resolve a %s name without any IDL', (_program, [programId, ...data], expected) => {
            expect(resolveNamesFromLookup(lookup(programId, ...data), idlNames({})).name).toBe(expected);
        });

        /**
         * The generated client sits ahead of the IDL so a simulated Token or System instruction is worded
         * the way the RPC words it on a fetched transaction. No IDL competes in production — every
         * program in PROGRAM_CLIENTS is in NON_ANCHOR_PROGRAMS, so useProgramIdlNames never
         * fetches one — which is exactly why only a test can hold the ordering in place.
         */
        it('should prefer the generated client over the IDL name table', () => {
            const names = resolveNamesFromLookup(
                lookup(TOKEN_PROGRAM, 12),
                idlNames({ [TOKEN_PROGRAM]: { programName: undefined, resolveInstructionName: () => 'From Idl' } }),
            );

            expect(names.name).toBe('Transfer Checked');
        });

        it('should prefer a built-in resolver over the IDL name table', () => {
            const names = resolveNamesFromLookup(
                lookup(ZK_PROGRAM, 3),
                idlNames({ [ZK_PROGRAM]: { programName: undefined, resolveInstructionName: () => 'From Idl' } }),
            );

            expect(names.name).toBe('Verify Ciphertext-Commitment Equality');
        });

        it('should name the program even when no source names the instruction', () => {
            const names = resolveNamesFromLookup(
                lookup('Prog1', 9),
                idlNames({ Prog1: { programName: 'Voting', resolveInstructionName: () => undefined } }),
            );

            expect(names).toEqual({ name: undefined, programName: 'Voting' });
        });
    });

    describe('negative cases: nothing names the instruction', () => {
        it('should leave both names unset when the program has no entry', () => {
            const names = resolveNamesFromLookup(lookup('Prog1', 9), idlNames({}));

            expect(names).toEqual({ name: undefined, programName: undefined });
        });

        it('should leave both names unset when the IDL has no usable table', () => {
            const names = resolveNamesFromLookup(
                lookup('Prog1', 9),
                idlNames({ Prog1: { programName: undefined, resolveInstructionName: undefined } }),
            );

            expect(names).toEqual({ name: undefined, programName: undefined });
        });
    });
});

/**
 * `nameLookup` present means "still unnamed"; a row that loses it while unnamed can never be named.
 * `keptLookup` owns that rule for every row shape, so these pin it through the simpler shape and the
 * summary block below pins the shape difference plus the identity it preserves.
 */
describe('applyNameSources', () => {
    it('should name a row and drop the lookup it no longer needs', () => {
        const names = applyNameSources(
            unnamed('Prog1', 1),
            idlNames({ Prog1: { programName: 'Voting', resolveInstructionName: () => 'Vote' } }),
        );

        expect(names).toEqual({ name: 'Vote', programName: 'Voting' });
    });

    it('should keep the lookup on a row nothing named', () => {
        const names = applyNameSources(unnamed('Prog1', 1), idlNames({}));

        expect(names).toEqual({
            name: undefined,
            nameLookup: { data: Uint8Array.from([1]), programId: 'Prog1' },
            programName: undefined,
        });
    });

    // Still unnamed, so it must stay resolvable — a later IDL fetch carrying an instruction table is the
    // only thing that can name it.
    it('should keep the lookup when the IDL names the program but not the instruction', () => {
        const names = applyNameSources(
            unnamed('Prog1', 1),
            idlNames({ Prog1: { programName: 'Voting', resolveInstructionName: undefined } }),
        );

        expect(names).toEqual({
            name: undefined,
            nameLookup: { data: Uint8Array.from([1]), programId: 'Prog1' },
            programName: 'Voting',
        });
    });

    it('should leave a row that carries no lookup untouched', () => {
        const names = applyNameSources({ name: 'Transfer', programName: 'System Program' }, idlNames({}));

        expect(names).toEqual({ name: 'Transfer', programName: 'System Program' });
    });
});

describe('applyNameSourcesToSummaries', () => {
    it('should name a row and drop the lookup it no longer needs', () => {
        const [row] = applyNameSourcesToSummaries(
            [summary('Prog1', 1)],
            idlNames({ Prog1: { programName: 'Voting', resolveInstructionName: () => 'Vote' } }),
        );

        expect(row).toEqual({ name: 'Vote', programName: 'Voting' });
    });

    it('should keep the lookup on a row nothing named', () => {
        const [row] = applyNameSourcesToSummaries([summary('Prog1', 1)], idlNames({}));

        expect(row.nameLookup).toBeDefined();
        expect(row.name).toBe(UNKNOWN_INSTRUCTION_NAME);
    });

    // Still unnamed, so it must stay resolvable — a later IDL fetch carrying an instruction table is the
    // only thing that can name it.
    it('should keep the lookup when the IDL names the program but not the instruction', () => {
        const [row] = applyNameSourcesToSummaries(
            [summary('Prog1', 1)],
            idlNames({ Prog1: { programName: 'Voting', resolveInstructionName: undefined } }),
        );

        expect(row).toEqual({
            name: UNKNOWN_INSTRUCTION_NAME,
            nameLookup: { data: Uint8Array.from([1]), programId: 'Prog1' },
            programName: 'Voting',
        });
    });

    // Identity, not equality: a memoizing consumer must not re-render for every IDL fetch that lands
    // without improving this row.
    it('should return the same object when nothing resolved', () => {
        const input = summary('Prog1', 1);

        const [row] = applyNameSourcesToSummaries([input], idlNames({}));

        expect(row).toBe(input);
    });

    /**
     * The lookup is dropped on "a source resolved", not on "the name changed". A summary already carries
     * the sentinel in `name`, so a source returning that exact string leaves every string equal to what
     * the row held; an equality test reads that as "resolved nothing" and hands back a named row still
     * asking for the IDL it has already been given. `programName` is left unresolved on purpose — with it
     * resolved, a string comparison differs on that field alone and passes for the wrong reason.
     */
    it('should drop the lookup when a source resolves the sentinel string and nothing else', () => {
        const [row] = applyNameSourcesToSummaries(
            [summary('Prog1', 1)],
            idlNames({
                Prog1: { programName: undefined, resolveInstructionName: () => UNKNOWN_INSTRUCTION_NAME },
            }),
        );

        expect(row).toEqual({ name: UNKNOWN_INSTRUCTION_NAME, programName: UNKNOWN_PROGRAM_NAME });
    });

    it('should leave a row that carries no lookup untouched', () => {
        const input: InstructionSummary = { name: 'Transfer', programName: 'System Program' };

        const [row] = applyNameSourcesToSummaries(
            [input],
            idlNames({ Prog1: { programName: 'Voting', resolveInstructionName: () => 'Vote' } }),
        );

        expect(row).toBe(input);
    });
});

const COMPUTE_BUDGET_PROGRAM = 'ComputeBudget111111111111111111111111111111';
const MEMO_PROGRAM = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
const ZK_PROGRAM = 'ZkE1Gama1Proof11111111111111111111111111111';
const SERUM_PROGRAM = 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX';
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const SYSTEM_PROGRAM = '11111111111111111111111111111111';
const MANGO_PROGRAM = 'mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68';
const PYTH_PROGRAM = 'FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH';

function lookup(programId: string, ...data: number[]): InstructionNameLookup {
    return { data: Uint8Array.from(data), programId };
}

/** A row as stage 1 leaves it when nothing named the instruction: no names, lookup still set. */
function unnamed(programId: string, ...data: number[]): InstructionNames {
    return { name: undefined, nameLookup: lookup(programId, ...data), programName: undefined };
}

/** A summary row as `summarizeInstruction` builds it: both names at their sentinels, lookup still set. */
function summary(programId: string, ...data: number[]): InstructionSummary {
    return {
        name: UNKNOWN_INSTRUCTION_NAME,
        nameLookup: lookup(programId, ...data),
        programName: UNKNOWN_PROGRAM_NAME,
    };
}

function idlNames(entries: Record<string, ProgramIdlNames>): Map<string, ProgramIdlNames> {
    return new Map(Object.entries(entries));
}
