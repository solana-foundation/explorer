import { describe, expect, it } from 'vitest';

import { isDecodeFailureMiss } from '../discriminator-miss';

// A parse miss in dynamic-parsers is ambiguous: `isDecodeFailureMiss` reads the last node of the
// identify* path — a match on a discriminator-bearing node is a real decode failure, while an undefined
// path or a discriminator-less single-candidate node (e.g. SPL Memo) stays a plain miss.
// eslint-disable-next-line typescript/consistent-type-assertions -- hand-built identify* path: only its last node's discriminators are read
const pathTo = (node: unknown) => [{ kind: 'rootNode' }, node] as unknown as Parameters<typeof isDecodeFailureMiss>[0];

describe('isDecodeFailureMiss', () => {
    it('should be false when identification produced no path', () => {
        expect(isDecodeFailureMiss(undefined)).toBe(false);
    });

    it('should be true when the matched node carries discriminators', () => {
        expect(isDecodeFailureMiss(pathTo({ discriminators: [{ kind: 'constantDiscriminatorNode' }] }))).toBe(true);
    });

    it('should be false for a discriminator-less single-candidate node', () => {
        expect(isDecodeFailureMiss(pathTo({ kind: 'instructionNode' }))).toBe(false);
    });

    it('should be false when the matched node carries an empty discriminator list', () => {
        expect(isDecodeFailureMiss(pathTo({ discriminators: [] }))).toBe(false);
    });
});
