import { parseInstruction } from '@codama/dynamic-parsers';
import type { Instruction } from '@solana/kit';
import { describe, expect, it, vi } from 'vitest';

import { decodeInstructionWithIdl } from '../decode-instruction';
import { loadTokenkegIdl, transferIx } from '../../__tests__/fixtures';

vi.mock('@codama/dynamic-parsers', () => ({
    parseInstruction: vi.fn(),
}));

describe('decodeInstructionWithIdl', () => {
    it('should default missing accounts and data before parsing', () => {
        const tokenkeg = loadTokenkegIdl();
        const ix = { programAddress: transferIx(tokenkeg).programAddress } as Instruction;

        const decode = decodeInstructionWithIdl(tokenkeg, ix);

        expect(decode.kind).toBe('unknown');
        expect(parseInstruction).toHaveBeenCalledExactlyOnceWith(tokenkeg, {
            accounts: [],
            data: new Uint8Array(),
            programAddress: ix.programAddress,
        });
    });
});
