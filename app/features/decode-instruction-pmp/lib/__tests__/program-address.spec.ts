import { PROGRAM_METADATA_PROGRAM_ADDRESS } from '@solana-program/program-metadata';
import { describe, expect, it } from 'vitest';

import { PMP_ADDRESS } from '../program-address';

describe('PMP_ADDRESS', () => {
    // The literal exists so the detection path does not import the generated client (see `program-address.ts`).
    // This is what replaces the compile-time guarantee that re-export gave: importing the client is free here,
    // because a spec never enters a route bundle.
    it('should match the address the generated client decodes against', () => {
        expect(PMP_ADDRESS).toBe(PROGRAM_METADATA_PROGRAM_ADDRESS);
    });
});
