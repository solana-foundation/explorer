import { Keypair, PublicKey } from '@solana/web3.js';
import { create } from 'superstruct';
import { describe, expect, it } from 'vitest';

import { IX_STRUCTS, IX_TITLES, TokenInstructionType } from '../types';

const randomAddress = () => Keypair.generate().publicKey.toBase58();

describe('token instruction types: withdrawExcessLamports', () => {
    it('should be a recognized TokenInstructionType', () => {
        expect(() => create('withdrawExcessLamports', TokenInstructionType)).not.toThrow();
    });

    it('should expose a human-readable title', () => {
        expect(IX_TITLES.withdrawExcessLamports).toBe('Withdraw Excess Lamports');
    });

    it('should validate the single-authority RPC parsed shape', () => {
        const source = randomAddress();
        const destination = randomAddress();
        const authority = randomAddress();

        const parsed = create({ authority, destination, source }, IX_STRUCTS.withdrawExcessLamports);

        expect(parsed.authority).toBeInstanceOf(PublicKey);
        expect(parsed.authority?.toBase58()).toBe(authority);
        expect(parsed.destination.toBase58()).toBe(destination);
        expect(parsed.source.toBase58()).toBe(source);
        expect(parsed.multisigAuthority).toBeUndefined();
        expect(parsed.signers).toBeUndefined();
    });

    it('should validate the multisig RPC parsed shape', () => {
        const source = randomAddress();
        const destination = randomAddress();
        const multisigAuthority = randomAddress();
        const signers = [randomAddress(), randomAddress()];

        const parsed = create({ destination, multisigAuthority, signers, source }, IX_STRUCTS.withdrawExcessLamports);

        expect(parsed.multisigAuthority?.toBase58()).toBe(multisigAuthority);
        expect(parsed.signers?.map(s => s.toBase58())).toEqual(signers);
        expect(parsed.authority).toBeUndefined();
    });
});

describe('token instruction types: Token-2022 extension instructions', () => {
    // Shapes taken from the RPC's jsonParsed output for devnet tx WohmW2vS…, which rendered as Unknown.
    it('should recognise initializePausableConfig and initializeDefaultAccountState', () => {
        const mint = randomAddress();
        const authority = randomAddress();

        expect(() => create('initializePausableConfig', TokenInstructionType)).not.toThrow();
        expect(() => create('initializeDefaultAccountState', TokenInstructionType)).not.toThrow();

        const pausable = create({ authority, mint }, IX_STRUCTS.initializePausableConfig);
        expect(pausable.authority?.toBase58()).toBe(authority);
        expect(pausable.mint.toBase58()).toBe(mint);

        const state = create({ accountState: 'initialized', mint }, IX_STRUCTS.initializeDefaultAccountState);
        expect(state.accountState).toBe('initialized');
    });

    it('should give every instruction type a validator and a title', () => {
        for (const type of TokenInstructionType.schema ? Object.keys(TokenInstructionType.schema) : []) {
            expect(IX_STRUCTS).toHaveProperty(type);
            expect(IX_TITLES).toHaveProperty(type);
        }
    });
});
