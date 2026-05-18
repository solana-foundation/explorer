import { PublicKey } from '@solana/web3.js';
import { create } from 'superstruct';
import { describe, expect, it } from 'vitest';

import { IX_STRUCTS, IX_TITLES, TokenInstructionType } from '../types';

const SOURCE = '11111111111111111111111111111112';
const DESTINATION = '11111111111111111111111111111113';
const AUTHORITY = '11111111111111111111111111111114';
const MULTISIG_AUTHORITY = '11111111111111111111111111111115';
const SIGNER_A = '11111111111111111111111111111116';
const SIGNER_B = '11111111111111111111111111111117';

describe('token instruction types: withdrawExcessLamports', () => {
    it('should be a recognized TokenInstructionType', () => {
        expect(() => create('withdrawExcessLamports', TokenInstructionType)).not.toThrow();
    });

    it('should expose a human-readable title', () => {
        expect(IX_TITLES.withdrawExcessLamports).toBe('Withdraw Excess Lamports');
    });

    it('should validate the single-authority RPC parsed shape', () => {
        const parsed = create(
            {
                authority: AUTHORITY,
                destination: DESTINATION,
                source: SOURCE,
            },
            IX_STRUCTS.withdrawExcessLamports,
        );

        expect(parsed.authority).toBeInstanceOf(PublicKey);
        expect(parsed.authority?.toBase58()).toBe(AUTHORITY);
        expect(parsed.destination.toBase58()).toBe(DESTINATION);
        expect(parsed.source.toBase58()).toBe(SOURCE);
        expect(parsed.multisigAuthority).toBeUndefined();
        expect(parsed.signers).toBeUndefined();
    });

    it('should validate the multisig RPC parsed shape', () => {
        const parsed = create(
            {
                destination: DESTINATION,
                multisigAuthority: MULTISIG_AUTHORITY,
                signers: [SIGNER_A, SIGNER_B],
                source: SOURCE,
            },
            IX_STRUCTS.withdrawExcessLamports,
        );

        expect(parsed.multisigAuthority?.toBase58()).toBe(MULTISIG_AUTHORITY);
        expect(parsed.signers?.map(s => s.toBase58())).toEqual([SIGNER_A, SIGNER_B]);
        expect(parsed.authority).toBeUndefined();
    });
});
