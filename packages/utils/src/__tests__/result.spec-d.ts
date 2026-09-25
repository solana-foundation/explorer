import { describe, expectTypeOf, it } from 'vitest';

import { err, ok, type Result, unwrap, unwrapOr } from '../result.js';

declare const result: Result<number>;

describe('result types', () => {
    it('should default the error type to Error', () => {
        expectTypeOf<Result<number>>().toEqualTypeOf<Result<number, Error>>();
    });

    it('should reject a non-Error error type', () => {
        // @ts-expect-error string does not extend Error
        expectTypeOf<Result<number, string>>();
    });

    it('should infer the arms of ok and err', () => {
        expectTypeOf(ok(1)).toEqualTypeOf<Result<number, never>>();
        expectTypeOf(err(new TypeError('error'))).toEqualTypeOf<Result<never, TypeError>>();
    });

    it('should narrow the destructured value after the error check', () => {
        const [error, value] = result;
        if (error) {
            expectTypeOf(error).toEqualTypeOf<Error>();
            expectTypeOf(value).toEqualTypeOf<undefined>();
        } else {
            expectTypeOf(value).toEqualTypeOf<number>();
        }
    });

    it('should return the ok type from unwrap', () => {
        expectTypeOf(unwrap(result)).toEqualTypeOf<number>();
    });

    it('should add the fallback type with unwrapOr', () => {
        expectTypeOf(unwrapOr(result, null)).toEqualTypeOf<number | null>();
    });
});
