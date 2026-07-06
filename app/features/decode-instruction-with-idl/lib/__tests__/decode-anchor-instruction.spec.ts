import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import anchor030Devi from '@/app/entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';

import { decodeAnchorInstruction } from '../decode-anchor-instruction';

// A real Program built from the bundled amm_v3 IDL fixture; the provider is a noop because decoding only
// touches the IDL + Borsh coders, never the network.
const noopWallet = {
    publicKey: PublicKey.default,
    signAllTransactions: async <T>(txs: T[]) => txs,
    signTransaction: async <T>(tx: T) => tx,
};
const mockProvider = {
    connection: { commitment: 'confirmed', rpcEndpoint: 'https://api.devnet.solana.com' },
    opts: { preflightCommitment: 'confirmed' },
    wallet: noopWallet,
} as unknown as AnchorProvider;
const anchorProgram = new Program(anchor030Devi as Idl, mockProvider);

// update_reward_infos: empty args + a single pool_state account — smallest reproducible instruction.
const UPDATE_REWARD_INFOS_DISCRIMINATOR = Uint8Array.from([163, 172, 224, 52, 11, 154, 106, 223]);

const buildInstruction = (data: Uint8Array) =>
    new TransactionInstruction({
        data: Buffer.from(data),
        keys: [{ isSigner: false, isWritable: true, pubkey: PublicKey.unique() }],
        programId: anchorProgram.programId,
    });

describe('decodeAnchorInstruction', () => {
    it('should decode a known instruction into its name, definition, accounts, and title', () => {
        const decoded = decodeAnchorInstruction(anchorProgram, buildInstruction(UPDATE_REWARD_INFOS_DISCRIMINATOR));

        expect(decoded.decodedIxData).toBeDefined();
        expect(decoded.ixDef).toBeDefined();
        expect(decoded.ixAccounts).toBeDefined();
        expect(decoded.ixAccounts?.length).toBeGreaterThan(0);
        expect(decoded.ixName).not.toBe('Unknown Instruction');
        // `${Program}: ${Instruction}` title-cased.
        expect(decoded.cardTitle).toContain(': ');
    });

    it('should leave the decode fields undefined for bytes that match no discriminator', () => {
        const decoded = decodeAnchorInstruction(anchorProgram, buildInstruction(new Uint8Array(8)));

        expect(decoded.decodedIxData).toBeUndefined();
        expect(decoded.ixAccounts).toBeUndefined();
        expect(decoded.ixDef).toBeUndefined();
        // The title still resolves — the program is known even when the instruction isn't.
        expect(decoded.ixName).toBe('Unknown Instruction');
        expect(decoded.cardTitle).toContain('Unknown');
    });
});
