import { AccountRole } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { intoTransactionInstructionFromVersionedMessage } from '@/app/components/inspector/utils';
import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import { COMPUTE_BUDGET_PROGRAM_ADDRESS, parseComputeBudgetKitInstruction } from '../compute-budget-parser';

function parseFixture(index: number) {
    const message = mock.deserializeMessageV0(stubs.computeBudgetMsg);
    const instruction = intoTransactionInstructionFromVersionedMessage(message.compiledInstructions[index], message);
    return parseComputeBudgetKitInstruction(toKitInstruction(instruction));
}

function parse(data: number[]) {
    return parseComputeBudgetKitInstruction({
        accounts: [],
        data: new Uint8Array(data),
        programAddress: COMPUTE_BUDGET_PROGRAM_ADDRESS,
    });
}

describe('parseComputeBudgetKitInstruction', () => {
    it('should decode Set Compute Unit Price from a mainnet message', () => {
        expect(parseFixture(0)).toEqual({ info: { microLamports: 7_187_812n }, type: 'setComputeUnitPrice' });
    });

    it('should decode Set Compute Unit Limit from a mainnet message', () => {
        expect(parseFixture(1)).toEqual({ info: { units: 155_666 }, type: 'setComputeUnitLimit' });
    });

    it('should decode Request Units', () => {
        expect(parse([0, 16, 39, 0, 0, 100, 0, 0, 0])).toEqual({
            info: { additionalFee: 100, units: 10_000 },
            type: 'requestUnits',
        });
    });

    it('should decode Request Heap Frame', () => {
        expect(parse([1, 0, 0, 1, 0])).toEqual({ info: { bytes: 65_536 }, type: 'requestHeapFrame' });
    });

    it('should decode Set Loaded Accounts Data Size Limit', () => {
        expect(parse([4, 0, 0, 16, 0])).toEqual({
            info: { accountDataSizeLimit: 1_048_576 },
            type: 'setLoadedAccountsDataSizeLimit',
        });
    });

    it('should reject an unknown discriminator rather than throw', () => {
        expect(parse([9, 1, 2, 3])).toBeUndefined();
    });

    it('should ignore accounts, which the program never reads', () => {
        expect(
            parseComputeBudgetKitInstruction({
                accounts: [{ address: COMPUTE_BUDGET_PROGRAM_ADDRESS, role: AccountRole.READONLY }],
                data: new Uint8Array([2, 160, 134, 1, 0]),
                programAddress: COMPUTE_BUDGET_PROGRAM_ADDRESS,
            }),
        ).toEqual({ info: { units: 100_000 }, type: 'setComputeUnitLimit' });
    });
});
