import { describe, expect, it } from 'vitest';

import { err, ok, toError } from '../result.js';

describe('result helpers', () => {
    it('should build error-first tuples with ok and err', () => {
        expect(ok(1)).toEqual([undefined, 1]);

        const failure = new Error('nope');
        expect(err(failure)).toEqual([failure, undefined]);
    });

    it('should pass Error instances through toError unchanged', () => {
        const thrown = new TypeError('bad');

        expect(toError(thrown)).toBe(thrown);
    });

    it('should wrap non-Error throws into an Error', () => {
        const wrapped = toError('boom');

        expect(wrapped).toBeInstanceOf(Error);
        expect(wrapped.message).toBe('boom');
    });
});
