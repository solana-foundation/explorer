import { IntegerOperator } from 'lighthouse-sdk';
import { describe, expect, test } from 'vitest';

import { withFormattedOperators } from '../format-operators';

describe('withFormattedOperators', () => {
    test('should map a numeric operator to its comparison symbol', () => {
        expect(withFormattedOperators({ operator: IntegerOperator.GreaterThanOrEqual })).toEqual({ operator: '>=' });
    });

    test('should recurse arrays, nested objects, and complex assertion fields', () => {
        const input = {
            assertions: [
                { __kind: 'Lamports', operator: IntegerOperator.LessThan, value: 1n },
                { __kind: 'MetaAssertion', fields: [{ __kind: 'AuthorizedStaker', operator: IntegerOperator.Equal }] },
            ],
        };

        expect(withFormattedOperators(input)).toEqual({
            assertions: [
                { __kind: 'Lamports', operator: '<', value: 1n },
                { __kind: 'MetaAssertion', fields: [{ __kind: 'AuthorizedStaker', operator: '=' }] },
            ],
        });
    });

    test('should leave non-operator fields and binary/bigint values untouched', () => {
        const bytes = new Uint8Array([1, 2, 3]);
        const out = withFormattedOperators({ data: bytes, logLevel: 4, memoryId: 0, value: 7n });

        expect(out).toEqual({ data: bytes, logLevel: 4, memoryId: 0, value: 7n });
        // Typed arrays pass through by reference — not cloned into a plain object.
        expect(out.data).toBe(bytes);
    });

    test('should not mutate its input', () => {
        const input = { operator: IntegerOperator.Equal };
        const out = withFormattedOperators(input);

        expect(input.operator).toBe(IntegerOperator.Equal);
        expect(out.operator).toBe('=');
    });
});
