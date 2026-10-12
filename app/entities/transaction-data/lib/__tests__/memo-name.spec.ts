import { MEMO_PROGRAM_ADDRESS, SUPPORTED_MEMO_PROGRAM_ADDRESSES } from '@solana-program/memo';

import { resolveMemoInstructionName } from '../memo-name';
import type { InstructionNameLookup } from '../types';

const SYSTEM_PROGRAM = '11111111111111111111111111111111';

describe('resolveMemoInstructionName', () => {
    describe('positive cases: any memo deployment', () => {
        it.each(SUPPORTED_MEMO_PROGRAM_ADDRESSES)('should name a memo sent to %s', programId => {
            expect(resolveMemoInstructionName(lookup(programId, utf8('gm')))).toBe('Memo');
        });

        // How `resolveInstructionNames` calls it — a ParsedInstruction carries no `data` at all.
        it('should name a memo with no data supplied', () => {
            expect(resolveMemoInstructionName({ programId: MEMO_PROGRAM_ADDRESS })).toBe('Memo');
        });

        // No discriminator to reject on, so every byte pattern is a valid memo. The last case would
        // name a Compute Budget instruction, which is why the program gate comes first.
        it.each([
            ['empty data', new Uint8Array()],
            ['non-UTF-8 bytes', new Uint8Array([0xff, 0xfe, 0xfd])],
            ['bytes that look like a discriminator', new Uint8Array([2, 0x40, 0x0d, 0x03, 0x00])],
        ])('should name a memo carrying %s', (_label, data) => {
            expect(resolveMemoInstructionName(lookup(MEMO_PROGRAM_ADDRESS, data))).toBe('Memo');
        });
    });

    describe('negative cases: other programs', () => {
        it('should return undefined for another program, even with memo text as data', () => {
            expect(resolveMemoInstructionName(lookup(SYSTEM_PROGRAM, utf8('gm')))).toBeUndefined();
        });
    });
});

// A full lookup, as the NAME_SOURCES entry passes it. A variable, not an inline literal: the narrowed
// parameter makes a fresh literal carrying `data` trip the excess-property check.
function lookup(programId: string, data: Uint8Array): InstructionNameLookup {
    return { data, programId };
}

function utf8(text: string): Uint8Array {
    return new TextEncoder().encode(text);
}
