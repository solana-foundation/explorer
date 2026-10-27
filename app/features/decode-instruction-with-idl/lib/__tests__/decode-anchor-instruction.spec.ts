import { describe, expect, it } from 'vitest';

import { ammV3Instruction, ammV3Program, UPDATE_REWARD_INFOS_DISCRIMINATOR } from '../../__fixtures__/anchor-programs';
import { decodeAnchorInstruction } from '../decode-anchor-instruction';

describe('decodeAnchorInstruction', () => {
    it('should decode a known instruction into its name, definition, accounts, and title', () => {
        const decoded = decodeAnchorInstruction(ammV3Program, ammV3Instruction(UPDATE_REWARD_INFOS_DISCRIMINATOR));

        expect(decoded.decodedIxData).toBeDefined();
        expect(decoded.ixDef).toBeDefined();
        expect(decoded.ixAccounts).toBeDefined();
        expect(decoded.ixAccounts?.length).toBeGreaterThan(0);
        expect(decoded.ixName).not.toBe('Unknown Instruction');
        // `${Program}: ${Instruction}` title-cased.
        expect(decoded.cardTitle).toContain(': ');
    });

    it('should leave the decode fields undefined for bytes that match no discriminator', () => {
        const decoded = decodeAnchorInstruction(ammV3Program, ammV3Instruction(new Uint8Array(8)));

        expect(decoded.decodedIxData).toBeUndefined();
        expect(decoded.ixAccounts).toBeUndefined();
        expect(decoded.ixDef).toBeUndefined();
        // The title still resolves — the program is known even when the instruction isn't.
        expect(decoded.ixName).toBe('Unknown Instruction');
        expect(decoded.cardTitle).toContain('Unknown');
    });
});
