import { describe, expect, it } from 'vitest';

import {
    ADDRESS_LOOKUP_TABLE_PROGRAM_ID,
    BPF_UPGRADEABLE_LOADER_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
} from '../constants.js';

// On-chain IDs are external invariants — a typo here misclassifies every account of that kind.
describe('constants', () => {
    it('should pin the well-known program ids', () => {
        expect(TOKEN_PROGRAM_ID).toBe('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
        expect(TOKEN_2022_PROGRAM_ID).toBe('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
        expect(BPF_UPGRADEABLE_LOADER_PROGRAM_ID).toBe('BPFLoaderUpgradeab1e11111111111111111111111');
        expect(ADDRESS_LOOKUP_TABLE_PROGRAM_ID).toBe('AddressLookupTab1e1111111111111111111111111');
    });
});
