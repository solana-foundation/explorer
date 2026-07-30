import { PROGRAM_DISPLAY_NAMES } from '@explorer/parsers';
import { describe, expect, it } from 'vitest';

import { LOADER_IDS, PROGRAM_NAMES } from '../programs';

// Drift canary: PROGRAM_NAMES is a string enum, so it cannot reference the shared map directly.
describe('program display names', () => {
    it('should match @explorer/parsers wording for enum-backed program names', () => {
        expect(PROGRAM_NAMES.SYSTEM).toBe(PROGRAM_DISPLAY_NAMES['11111111111111111111111111111111']);
        expect(PROGRAM_NAMES.TOKEN).toBe(PROGRAM_DISPLAY_NAMES['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA']);
        expect(PROGRAM_NAMES.TOKEN_2022).toBe(PROGRAM_DISPLAY_NAMES['TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb']);
        expect(PROGRAM_NAMES.VOTE).toBe(PROGRAM_DISPLAY_NAMES['Vote111111111111111111111111111111111111111']);
        expect(PROGRAM_NAMES.ADDRESS_LOOKUP_TABLE).toBe(
            PROGRAM_DISPLAY_NAMES['AddressLookupTab1e1111111111111111111111111'],
        );
        expect(PROGRAM_NAMES.SAS_PROGRAM).toBe(PROGRAM_DISPLAY_NAMES['22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG']);
    });

    it('should match @explorer/parsers wording for loader names', () => {
        const sharedLoaderAddresses = [
            'BPFLoader1111111111111111111111111111111111',
            'BPFLoader2111111111111111111111111111111111',
            'BPFLoaderUpgradeab1e11111111111111111111111',
            'NativeLoader1111111111111111111111111111111',
        ];
        for (const address of sharedLoaderAddresses) {
            expect(LOADER_IDS[address]).toBe(PROGRAM_DISPLAY_NAMES[address]);
        }
    });
});
