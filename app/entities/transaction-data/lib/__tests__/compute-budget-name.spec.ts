import { ComputeBudgetProgram, SystemProgram } from '@solana/web3.js';
import { ComputeBudgetInstruction } from '@solana-program/compute-budget';

import { COMPUTE_BUDGET_INSTRUCTION_NAMES, resolveComputeBudgetInstructionName } from '../compute-budget-name';

describe('resolveComputeBudgetInstructionName', () => {
    describe('positive cases: recognized instructions', () => {
        // A function, not a const: `it.each` runs at collection time, before a bottom-of-file
        // `const` is initialized. Function declarations hoist, so this reads top-down and still works.
        it.each(recognizedInstructions())('should name a %s instruction', (expected, data) => {
            const name = resolveComputeBudgetInstructionName({
                data,
                programId: ComputeBudgetProgram.programId.toBase58(),
            });

            expect(name).toBe(expected);
        });
    });

    describe('negative cases: other programs and unrecognized data', () => {
        it('should return undefined for another program, even with compute budget data', () => {
            const name = resolveComputeBudgetInstructionName({
                data: setComputeUnitLimitData(),
                programId: SystemProgram.programId.toBase58(),
            });

            expect(name).toBeUndefined();
        });

        it('should return undefined for an unrecognized discriminator', () => {
            const name = resolveComputeBudgetInstructionName({
                data: new Uint8Array([99]),
                programId: ComputeBudgetProgram.programId.toBase58(),
            });

            expect(name).toBeUndefined();
        });

        it('should return undefined for empty data', () => {
            const name = resolveComputeBudgetInstructionName({
                data: new Uint8Array(),
                programId: ComputeBudgetProgram.programId.toBase58(),
            });

            expect(name).toBeUndefined();
        });
    });

    /**
     * The name table is typed total over the enum, so a package bump that adds an instruction is a
     * compile error. This asserts the same thing at runtime, which is what catches a bump that widens
     * the enum without breaking the type — every unnamed instruction would otherwise silently read as
     * "Instruction #N" on nearly every transaction.
     */
    it('should name every instruction the installed client knows', () => {
        const members = Object.values(ComputeBudgetInstruction).filter(value => typeof value === 'number');

        expect(members.length).toBeGreaterThan(0);
        for (const member of members) {
            expect(COMPUTE_BUDGET_INSTRUCTION_NAMES[member]).toBeTypeOf('string');
        }
    });
});

// Only the leading discriminator byte is read, so the trailing argument bytes are filler.
function recognizedInstructions(): [string, Uint8Array][] {
    return [
        ['Request Units (Deprecated)', new Uint8Array([0, 0x40, 0x0d, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00])],
        ['Request Heap Frame', new Uint8Array([1, 0x00, 0x00, 0x04, 0x00])],
        ['Set Compute Unit Limit', setComputeUnitLimitData()],
        ['Set Compute Unit Price', new Uint8Array([3, 0x90, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])],
        ['Set Loaded Account Data Size Limit', new Uint8Array([4, 0x00, 0x00, 0x04, 0x00])],
    ];
}

function setComputeUnitLimitData(): Uint8Array {
    return new Uint8Array([2, 0x40, 0x0d, 0x03, 0x00]);
}
