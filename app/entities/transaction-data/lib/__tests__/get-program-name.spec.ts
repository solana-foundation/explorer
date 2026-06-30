import { PublicKey } from '@solana/web3.js';
import { LOADER_IDS, PROGRAM_INFO_BY_ID } from '@utils/programs';
import { describe, expect, it } from 'vitest';

import { getProgramName } from '../get-program-name';

const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111';
const NATIVE_LOADER_ID = 'NativeLoader1111111111111111111111111111111';
// Not present in either lookup table.
const UNKNOWN_ID = 'So11111111111111111111111111111111111111112';

describe('getProgramName', () => {
    it('should resolve a known program from PROGRAM_INFO_BY_ID', () => {
        const expected = PROGRAM_INFO_BY_ID[SYSTEM_PROGRAM_ID].name;

        expect(expected).toBeDefined();
        expect(getProgramName(new PublicKey(SYSTEM_PROGRAM_ID))).toBe(expected);
    });

    it('should fall back to LOADER_IDS when the program is a loader', () => {
        expect(LOADER_IDS[NATIVE_LOADER_ID]).toBe('Native Loader');
        expect(getProgramName(new PublicKey(NATIVE_LOADER_ID))).toBe('Native Loader');
    });

    it('should return the default fallback for an unknown program', () => {
        expect(getProgramName(new PublicKey(UNKNOWN_ID))).toBe('Unknown Program');
    });

    it('should return the provided fallback for an unknown program', () => {
        expect(getProgramName(new PublicKey(UNKNOWN_ID), 'Custom Fallback')).toBe('Custom Fallback');
    });

    it('should prefer a known name over the provided fallback', () => {
        expect(getProgramName(new PublicKey(NATIVE_LOADER_ID), 'Custom Fallback')).toBe('Native Loader');
    });
});
