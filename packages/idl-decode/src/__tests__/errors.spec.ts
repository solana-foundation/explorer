import { describe, expect, it } from 'vitest';

import {
    getIdlErrorMessage,
    IDL_ERROR__DECODE_UNIMPLEMENTED,
    IDL_ERROR__IDL_ADDRESS_MISMATCH,
    IDL_ERROR__IDL_FETCH_FAILED,
    IDL_ERROR__INSTRUCTION_DECODE_FAILED,
    IDL_ERROR__PROGRAM_ADDRESS_REQUIRED,
    IDL_ERROR__UNSUPPORTED_IDL_FORMAT,
    IdlError,
    isIdlError,
} from '../errors';
import { IdlStandard } from '../types';

describe('IdlError', () => {
    it('should compose its message from the registry and the context', () => {
        const error = new IdlError(IDL_ERROR__IDL_ADDRESS_MISMATCH, { declaredAddress: 'AAA', programAddress: 'BBB' });
        expect(error.message).toBe('IDL program AAA does not match program BBB');
        expect(error.code).toBe(IDL_ERROR__IDL_ADDRESS_MISMATCH);
        expect(error.context).toEqual({ declaredAddress: 'AAA', programAddress: 'BBB' });
    });

    it('should build context-free errors without a context argument', () => {
        const error = new IdlError(IDL_ERROR__UNSUPPORTED_IDL_FORMAT);
        expect(error.message).toBe(getIdlErrorMessage(IDL_ERROR__UNSUPPORTED_IDL_FORMAT, undefined));
        expect(error.context).toBeUndefined();
    });

    it('should describe unimplemented decode operations', () => {
        const error = new IdlError(IDL_ERROR__DECODE_UNIMPLEMENTED, { operation: 'decode account' });
        expect(error.message).toBe('decode account is not implemented');
    });

    it('should describe IDL fetch failures', () => {
        const error = new IdlError(IDL_ERROR__IDL_FETCH_FAILED);
        expect(error.message).toBe('failed to fetch the program IDL');
    });

    it('should name the program in the missing-address message only when the IDL declares one', () => {
        expect(new IdlError(IDL_ERROR__PROGRAM_ADDRESS_REQUIRED, { programName: 'ntt' }).message).toBe(
            'the legacy IDL for ntt declares no program address — pass options.programAddress',
        );
        expect(new IdlError(IDL_ERROR__PROGRAM_ADDRESS_REQUIRED, {}).message).toBe(
            'the legacy IDL declares no program address — pass options.programAddress',
        );
    });

    it('should carry a cause passed alongside the context', () => {
        const cause = new Error('borsh blew up');
        const error = new IdlError(IDL_ERROR__INSTRUCTION_DECODE_FAILED, {
            cause,
            programAddress: 'AAA',
            standard: IdlStandard.Anchor,
        });
        expect(error.cause).toBe(cause);
    });
});

describe('isIdlError', () => {
    const error: unknown = new IdlError(IDL_ERROR__INSTRUCTION_DECODE_FAILED, {
        programAddress: 'AAA',
        standard: IdlStandard.Codama,
    });

    it('should match any IdlError without a code', () => {
        expect(isIdlError(error)).toBe(true);
        expect(isIdlError(new Error('plain'))).toBe(false);
    });

    it('should discriminate by code', () => {
        expect(isIdlError(error, IDL_ERROR__INSTRUCTION_DECODE_FAILED)).toBe(true);
        expect(isIdlError(error, IDL_ERROR__UNSUPPORTED_IDL_FORMAT)).toBe(false);
    });
});
