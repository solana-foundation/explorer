import { getTransactionInstructionError } from '@utils/program-err';
import { describe, expect, it } from 'vitest';

describe('getTransactionInstructionError', () => {
    it.each([
        [
            'MaxAccountsDataAllocationsExceeded',
            'Accounts data allocations exceeded the maximum allowed per transaction',
        ],
        ['MaxAccountsExceeded', 'Max accounts exceeded'],
        ['MaxInstructionTraceLengthExceeded', 'Max instruction trace length exceeded'],
        ['BuiltinProgramsMustConsumeComputeUnits', 'Builtin programs must consume compute units'],
    ])('should describe the %s instruction error', (name, message) => {
        expect(getTransactionInstructionError({ InstructionError: [1, name] } as never)).toEqual({
            index: 1,
            message,
        });
    });

    it('should describe BorshIoError without a message payload', () => {
        expect(getTransactionInstructionError({ InstructionError: [0, 'BorshIoError'] })).toEqual({
            index: 0,
            message: 'Failed to serialize or deserialize account data',
        });
    });

    it('should append the message payload of a BorshIoError that carries one', () => {
        expect(
            getTransactionInstructionError({ InstructionError: [0, { BorshIoError: 'Unexpected length of input' }] }),
        ).toEqual({
            index: 0,
            message: 'Failed to serialize or deserialize account data: Unexpected length of input',
        });
    });

    it('should keep the generic message for an unrecognised instruction error', () => {
        expect(getTransactionInstructionError({ InstructionError: [0, 'NotARealError'] } as never)).toEqual({
            index: 0,
            message: 'Unknown instruction error',
        });
    });
});
