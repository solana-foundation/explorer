import { describe, expect, it } from 'vitest';

import { PROGRAM_DISPLAY_NAMES } from '../program-names.js';

describe('PROGRAM_DISPLAY_NAMES', () => {
    it('should pin the display-name wording for the built-in program set', () => {
        expect(PROGRAM_DISPLAY_NAMES).toEqual({
            '11111111111111111111111111111111': 'System Program',
            '22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG': 'Solana Attestation Service Program',
            AddressLookupTab1e1111111111111111111111111: 'Address Lookup Table Program',
            BPFLoader1111111111111111111111111111111111: 'BPF Loader',
            BPFLoader2111111111111111111111111111111111: 'BPF Loader 2',
            BPFLoaderUpgradeab1e11111111111111111111111: 'BPF Upgradeable Loader',
            LoaderV411111111111111111111111111111111111: 'Loader v4',
            NativeLoader1111111111111111111111111111111: 'Native Loader',
            TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: 'Token Program',
            TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb: 'Token-2022 Program',
            Vote111111111111111111111111111111111111111: 'Vote Program',
        });
    });
});
