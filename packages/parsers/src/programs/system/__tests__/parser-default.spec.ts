import { describe, expect, it, vi } from 'vitest';

import { parseSystemInstruction } from '../parser.js';

// The identify→switch is exhaustive over today's SystemInstruction enum; the default arm only fires
// when a future @solana-program/system adds a member — simulated here.
vi.mock('@solana-program/system', async importOriginal => ({
    ...(await importOriginal<Record<string, unknown>>()),
    identifySystemInstruction: vi.fn(() => 999),
}));

describe('parseSystemInstruction (unknown enum member)', () => {
    it('should return undefined for instruction kinds newer than the bundled client', () => {
        const instruction = { accounts: [], data: new Uint8Array([2, 0, 0, 0]), programAddress: '111' } as never;

        expect(parseSystemInstruction(instruction)).toBeUndefined();
    });
});
