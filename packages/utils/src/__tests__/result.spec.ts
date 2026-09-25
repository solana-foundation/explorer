import { describe, expect, it } from 'vitest';

import { err, ok, toError, unwrap, unwrapOr } from '../result.js';

describe('result helpers', () => {
    it('should build error-first tuples with ok and err', () => {
        expect(ok(1)).toEqual([undefined, 1]);

        const failure = new Error('error');
        expect(err(failure)).toEqual([failure, undefined]);
    });

    it('should unwrap the value', () => {
        expect(unwrap(ok(1))).toBe(1);
    });

    it('should unwrap and throw anerror', () => {
        const failure = new TypeError('error');

        expect(() => unwrap(err(failure))).toThrow(failure);
    });

    it.each([
        { expected: 1, name: 'the value from ok', result: ok(1) },
        { expected: null, name: 'the fallback from err', result: err(new Error('error')) },
    ])('should unwrapOr to $name', ({ result, expected }) => {
        expect(unwrapOr(result, null)).toBe(expected);
    });

    it('should pass Error instances through toError unchanged', () => {
        const thrown = new TypeError('error');

        expect(toError(thrown)).toBe(thrown);
    });

    it('should wrap to error', () => {
        const wrapped = toError('error');

        expect(wrapped).toBeInstanceOf(Error);
        expect(wrapped.message).toBe('error');
    });
});
