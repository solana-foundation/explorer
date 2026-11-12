import { getTransactionInstructionError } from '@utils/program-err';
import { describe, expect, it } from 'vitest';

describe('getTransactionInstructionError', () => {
    it.each([0, 0n, 1, 1n])('should format custom error code %s', code => {
        expect(getTransactionInstructionError({ InstructionError: [2, { Custom: code }] })).toEqual({
            index: 2,
            message: `custom program error: ${code}`,
        });
    });

    it('should keep named instruction errors readable', () => {
        expect(getTransactionInstructionError({ InstructionError: [0, 'InvalidArgument'] })).toEqual({
            index: 0,
            message: 'invalid program argument',
        });
    });

    it('should return no instruction error for a transaction-level failure', () => {
        expect(getTransactionInstructionError('InsufficientFundsForFee')).toBeUndefined();
    });
});
