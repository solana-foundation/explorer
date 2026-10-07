import type { Address, ReadonlyUint8Array } from '@solana/kit';
import {
    COMPUTE_BUDGET_PROGRAM_ADDRESS,
    ComputeBudgetInstruction,
    getRequestUnitsInstruction,
    getSetComputeUnitLimitInstruction,
    getSetComputeUnitPriceInstruction,
} from '@solana-program/compute-budget';
import { describe, expect, it } from 'vitest';

import { gen } from '../../../__tests__/gen.js';
import type { TransactionInstruction } from '../../../transaction/types.js';
import { readComputeUnitLimitFromInstruction } from '../instructions.js';

function toTransactionInstruction(instruction: {
    data: ReadonlyUint8Array;
    programAddress: Address;
}): TransactionInstruction {
    return { accounts: [], data: new Uint8Array(instruction.data), programAddress: instruction.programAddress };
}

describe('readComputeUnitLimitFromInstruction', () => {
    it('should read the units of a SetComputeUnitLimit instruction', () => {
        const instruction = toTransactionInstruction(getSetComputeUnitLimitInstruction({ units: 100_000 }));

        expect(readComputeUnitLimitFromInstruction(instruction)).toBe(100_000);
    });

    it('should read the units of a legacy RequestUnits instruction', () => {
        const instruction = toTransactionInstruction(getRequestUnitsInstruction({ additionalFee: 0, units: 50_000 }));

        expect(readComputeUnitLimitFromInstruction(instruction)).toBe(50_000);
    });

    it('should return undefined when the instruction targets another program', () => {
        expect(
            readComputeUnitLimitFromInstruction({
                accounts: [],
                data: new Uint8Array([1]),
                programAddress: gen.systemProgram,
            }),
        ).toBeUndefined();
    });

    it('should return undefined when the instruction sets no limit', () => {
        const instruction = toTransactionInstruction(getSetComputeUnitPriceInstruction({ microLamports: 5n }));

        expect(readComputeUnitLimitFromInstruction(instruction)).toBeUndefined();
    });

    it('should return undefined when the instruction discriminator is unknown', () => {
        const instruction = {
            accounts: [],
            data: new Uint8Array([0xff]),
            programAddress: COMPUTE_BUDGET_PROGRAM_ADDRESS,
        };

        expect(readComputeUnitLimitFromInstruction(instruction)).toBeUndefined();
    });

    it('should return undefined when the SetComputeUnitLimit data is truncated', () => {
        const instruction = {
            accounts: [],
            data: new Uint8Array([ComputeBudgetInstruction.SetComputeUnitLimit, 1, 2]),
            programAddress: COMPUTE_BUDGET_PROGRAM_ADDRESS,
        };

        expect(readComputeUnitLimitFromInstruction(instruction)).toBeUndefined();
    });

    it('should return undefined when the RPC sent a parsed instruction instead of its data', () => {
        expect(
            readComputeUnitLimitFromInstruction({ parsed: {}, programAddress: COMPUTE_BUDGET_PROGRAM_ADDRESS }),
        ).toBeUndefined();
    });
});
