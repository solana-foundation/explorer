import { describe, expect, it } from 'vitest';

import { MANGO_PROGRAM_IDS, MANGO_V3_PROGRAM_LABEL } from '../program-ids';

// Source of truth for the app registry: the Mango v3 addresses and the deprecated label it renders.
describe('program-ids', () => {
    it('should expose the three Mango v3 program addresses', () => {
        expect(MANGO_PROGRAM_IDS.mainnet.toBase58()).toBe('mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68');
        expect(MANGO_PROGRAM_IDS.devnet.toBase58()).toBe('4skJ85cdxQAFVKbcGgfun8iZPL7BadVYXG3kGEGkufqA');
        expect(MANGO_PROGRAM_IDS.testnet.toBase58()).toBe('BXhdkETgbHrr5QmVBT1xbz3JrMM28u5djbVtmTUfmFTH');
    });

    it('should mark Mango v3 as deprecated', () => {
        expect(MANGO_V3_PROGRAM_LABEL).toBe('Mango v3 (deprecated)');
    });
});
