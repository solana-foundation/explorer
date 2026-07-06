import { LIGHTHOUSE_PROGRAM_ADDRESS } from 'lighthouse-sdk';
import { describe, expect, test } from 'vitest';

import { resolveLighthouseInstructionName } from '../instruction-names';

describe('resolveLighthouseInstructionName', () => {
    test('should resolve the name from the leading discriminator byte', () => {
        // 15 = AssertSysvarClock, 1 = MemoryClose, 5 = AssertAccountInfo.
        expect(resolveLighthouseInstructionName(LIGHTHOUSE_PROGRAM_ADDRESS, Uint8Array.from([15, 0, 0]))).toBe(
            'Assert Sysvar Clock',
        );
        expect(resolveLighthouseInstructionName(LIGHTHOUSE_PROGRAM_ADDRESS, Uint8Array.from([1]))).toBe('Memory Close');
        expect(resolveLighthouseInstructionName(LIGHTHOUSE_PROGRAM_ADDRESS, Uint8Array.from([5]))).toBe(
            'Assert Account Info',
        );
    });

    test('should return undefined for a non-Lighthouse program', () => {
        expect(
            resolveLighthouseInstructionName('11111111111111111111111111111111', Uint8Array.from([15])),
        ).toBeUndefined();
    });

    test('should return undefined for an unrecognized discriminator', () => {
        expect(resolveLighthouseInstructionName(LIGHTHOUSE_PROGRAM_ADDRESS, Uint8Array.from([255]))).toBeUndefined();
    });
});
