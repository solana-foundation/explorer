import { Idl, Program } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it, vi } from 'vitest';

// Force the self-CPI event branch and hand it a decoded event, so the test exercises the
// events/types-out-of-sync case without needing a real Borsh event coder.
vi.mock('@utils/anchor', () => ({
    decodeEventWithCustomDiscriminator: () => ({ data: {}, name: 'MyEvent' }),
    decodeInstructionWithCustomDiscriminator: () => null,
    getAnchorAccountsFromInstruction: () => [],
    getAnchorNameForInstruction: () => 'myEvent',
    getAnchorProgramName: () => 'myProgram',
    instructionIsSelfCPI: () => true,
}));

import { decodeAnchorInstruction } from '../decode-anchor-instruction';

// The event resolves in `events` but has no matching entry in `types` (the two arrays are out of sync).
const anchorProgram = {
    idl: { events: [{ name: 'MyEvent' }], types: [] },
} as unknown as Program<Idl>;

const ix = new TransactionInstruction({
    data: Buffer.from(Uint8Array.from([228, 69, 165, 46, 81, 203, 154, 29, 0, 0])),
    keys: [],
    programId: PublicKey.unique(),
});

describe('decodeAnchorInstruction (self-CPI, event type missing from IDL)', () => {
    it('should fall back to empty args instead of throwing when the event type is absent from `types`', () => {
        const decoded = decodeAnchorInstruction(anchorProgram, ix);

        expect(decoded.decodedIxData).toBeDefined();
        expect(decoded.ixDef?.args).toEqual([]);
        // Self-CPI instructions carry the single eventAuthority account.
        expect(decoded.ixAccounts).toHaveLength(1);
    });
});
