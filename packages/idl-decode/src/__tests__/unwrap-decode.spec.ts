import { describe, expect, expectTypeOf, it } from 'vitest';

import { IDL_ERROR__DECODE_KIND_MISMATCH, IdlError, isIdlError } from '../errors';
import { anchorArm, codamaArm, type CodamaDecodedInstruction, unknownArm, unwrap } from '../types';

// a minimal parsed-instruction envelope — the path's last node is what unwrap surfaces as `node`
const decoded = {
    accounts: [],
    data: { amount: 42n },
    path: [
        { kind: 'rootNode' },
        { kind: 'programNode', name: 'p' },
        { arguments: [], kind: 'instructionNode', name: 'increment' },
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- hand-built NodePath stand-in; the real one comes from dynamic-parsers
    ] as unknown as CodamaDecodedInstruction['path'],
};

describe('unwrap', () => {
    it('should return the decode envelope with the matched schema node attached', () => {
        const unwrapped = unwrap(codamaArm(decoded));

        expectTypeOf(unwrapped.node.name).toBeString();
        expect(unwrapped.node.name).toBe('increment');
        expect(unwrapped.data).toEqual({ amount: 42n });
        expect(unwrapped.path).toBe(decoded.path);
    });

    it('should throw the typed kind-mismatch error for the unknown arm', () => {
        expect(() => unwrap(unknownArm([]))).toThrowError(IdlError);
        try {
            unwrap(unknownArm([]));
        } catch (error) {
            expect(isIdlError(error, IDL_ERROR__DECODE_KIND_MISMATCH)).toBe(true);
        }
    });

    it('should throw the typed kind-mismatch error for the anchor arm', () => {
        expect(() => unwrap(anchorArm({ name: 'increment' }))).toThrowError(IdlError);
    });
});
