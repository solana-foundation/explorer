import { instructionNode, programNode, rootNode } from 'codama';
import { describe, expect, it } from 'vitest';

import { withSingleInstructionDiscriminator } from '../with-single-instruction-discriminator';

const PUBKEY = '11111111111111111111111111111111';

const build = (...names: string[]) =>
    rootNode(programNode({ instructions: names.map(name => instructionNode({ name })), name: 'p', publicKey: PUBKEY }));

describe('withSingleInstructionDiscriminator', () => {
    it('should inject a catch-all discriminator for a single-instruction program without one', () => {
        const result = withSingleInstructionDiscriminator(build('foo'));
        expect(result.program.instructions[0].discriminators).toHaveLength(1);
    });

    it('should leave a multi-instruction program unchanged', () => {
        const root = build('a', 'b');
        const result = withSingleInstructionDiscriminator(root);
        expect(result).toBe(root);
        expect(result.program.instructions[0].discriminators).toBeUndefined();
    });
});
