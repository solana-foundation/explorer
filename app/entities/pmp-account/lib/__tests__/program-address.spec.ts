import { PublicKey } from '@solana/web3.js';
import { PROGRAM_METADATA_PROGRAM_ADDRESS } from '@solana-program/program-metadata';
import { describe, expect, it } from 'vitest';

import { isPmpAccount, PMP_ADDRESS } from '../program-address';

describe('PMP_ADDRESS', () => {
    // The literal exists so the detection path does not import the generated client (see `program-address.ts`).
    // This is what replaces the compile-time guarantee that re-export gave: importing the client is free here,
    // because a spec never enters a route bundle.
    it('should match the address the generated client decodes against', () => {
        expect(PMP_ADDRESS).toBe(PROGRAM_METADATA_PROGRAM_ADDRESS);
    });
});

describe('isPmpAccount', () => {
    it('should accept an account owned by the Program Metadata Program', () => {
        expect(isPmpAccount({ owner: new PublicKey(PMP_ADDRESS) })).toBe(true);
    });

    // The System Program address, which is what a plain wallet account is owned by.
    it('should reject an account owned by another program', () => {
        expect(isPmpAccount({ owner: new PublicKey('11111111111111111111111111111111') })).toBe(false);
    });
});
