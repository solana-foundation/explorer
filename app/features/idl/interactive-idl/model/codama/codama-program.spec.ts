import { gen } from '@__fixtures__/gen';
import { createProgramClient } from '@codama/dynamic-client';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import type { RootNode } from 'codama';
import { describe, expect, it } from 'vitest';

import codamaVotingIdl from '../__mocks__/codama/codama-voting.json';
import systemProgramIdl from '../__mocks__/codama/system-program-idl.json';
import type { BaseIdl } from '../unified-program.d';
import { CodamaUnifiedProgram } from './codama-program';

function createProgram(idl: RootNode, programId?: PublicKey) {
    const pubkey = programId ?? PublicKey.default;
    const client = createProgramClient(idl, { programId: pubkey.toBase58() });
    return new CodamaUnifiedProgram(pubkey, idl as unknown as BaseIdl, client);
}

describe('CodamaUnifiedProgram', () => {
    const systemIdl = systemProgramIdl as unknown as RootNode;
    const votingIdl = codamaVotingIdl as unknown as RootNode;

    describe('properties', () => {
        it('should expose programId', () => {
            const pubkey = gen.publicKey(1);
            const program = createProgram(systemIdl, pubkey);
            expect(program.programId).toEqual(pubkey);
        });

        it('should expose idl', () => {
            const program = createProgram(systemIdl);
            expect(program.idl).toBeDefined();
        });
    });

    describe('getClient', () => {
        it('should return ProgramClient with instructions', () => {
            const program = createProgram(systemIdl);
            const client = program.getClient();
            expect(client).toBeDefined();
            expect(client.instructions.size).toBeGreaterThan(0);
        });

        it('should have transferSol instruction', () => {
            const program = createProgram(systemIdl);
            expect(program.getClient().instructions.has('transferSol')).toBe(true);
        });
    });

    describe('buildInstruction', () => {
        it('should build a valid TransactionInstruction', async () => {
            const program = createProgram(systemIdl);
            const ix = await program.buildInstruction(
                'transferSol',
                { destination: gen.publicKey(2), source: gen.publicKey(1) },
                ['1000000'],
            );

            expect(ix).toBeInstanceOf(TransactionInstruction);
            expect(ix.programId).toEqual(PublicKey.default);
            expect(ix.keys).toHaveLength(2);
            expect(ix.data.length).toBeGreaterThan(0);
        });

        it('should set correct account roles (signer, writable)', async () => {
            const program = createProgram(systemIdl);
            const source = gen.publicKey(1);
            const destination = gen.publicKey(2);

            const ix = await program.buildInstruction('transferSol', { destination, source }, ['500']);

            // Both source and destination are writable signers for transferSol
            const sourceKey = ix.keys.find(k => k.pubkey.equals(source));
            expect(sourceKey?.isSigner).toBe(true);
            expect(sourceKey?.isWritable).toBe(true);
        });

        it('should convert string amounts to BigInt for u64 args', async () => {
            const program = createProgram(systemIdl);
            const source = gen.publicKey(1);
            const destination = gen.publicKey(2);

            // Large value that exceeds Number.MAX_SAFE_INTEGER
            const ix = await program.buildInstruction('transferSol', { destination, source }, ['9999999999999999999']);

            expect(ix).toBeInstanceOf(TransactionInstruction);
            expect(ix.data.length).toBeGreaterThan(0);
        });

        it('should handle null accounts by passing null address', async () => {
            const program = createProgram(systemIdl);
            const source = gen.publicKey(1);

            // Passing null for destination
            await expect(
                program.buildInstruction('transferSol', { destination: null, source }, ['1000']),
            ).rejects.toThrow();
        });

        it('should throw for unknown instruction name', async () => {
            const program = createProgram(systemIdl);

            await expect(program.buildInstruction('fakeInstruction', {}, [])).rejects.toThrow(
                'Instruction "fakeInstruction" not found',
            );
        });

        it('should include available instruction names in error message', async () => {
            const program = createProgram(systemIdl);

            // eslint-disable-next-line no-restricted-syntax -- regex needed to match partial error message
            await expect(program.buildInstruction('fakeInstruction', {}, [])).rejects.toThrow(/Available:/);
        });

        it('should filter omitted arguments (discriminators)', async () => {
            const program = createProgram(votingIdl);
            const signer = gen.publicKey(1);

            // initializeCandidate has 3 arguments: discriminator (omitted), candidateName, pollId
            // Only 2 user-facing args should be expected
            const ix = await program.buildInstruction(
                'initializeCandidate',
                {
                    candidate: gen.publicKey(2),
                    poll: gen.publicKey(2),
                    signer,
                    systemProgram: new PublicKey('11111111111111111111111111111111'),
                },
                ['TestCandidate', '42'],
            );

            expect(ix).toBeInstanceOf(TransactionInstruction);
        });

        it('should throw descriptive error when argument conversion fails', async () => {
            const program = createProgram(votingIdl);
            const signer = gen.publicKey(1);

            // pollId (u64) gets an invalid value
            await expect(
                program.buildInstruction(
                    'initializeCandidate',
                    {
                        candidate: signer,
                        poll: signer,
                        signer,
                        systemProgram: new PublicKey('11111111111111111111111111111111'),
                    },
                    ['Test', 'not-a-number'],
                ),
                // eslint-disable-next-line no-restricted-syntax -- regex needed to match partial error message
            ).rejects.toThrow(/Could not convert "pollId" argument/);
        });
    });
});
