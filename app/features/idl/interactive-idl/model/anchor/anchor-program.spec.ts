import type { Idl as AnchorIdl } from '@coral-xyz/anchor';
import type NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { AnchorInterpreter } from './anchor-interpreter';

describe('AnchorUnifiedProgram', () => {
    describe('getIdl', () => {
        const programId = new PublicKey('11111111111111111111111111111111');
        const connection = new Connection('https://mainnet.rpc.address');
        const wallet = {
            publicKey: Keypair.generate().publicKey,
            signAllTransactions: async () => {
                throw new Error('Not implemented');
            },
            signTransaction: async () => {
                throw new Error('Not implemented');
            },
        } as unknown as NodeWallet;

        const interpreter = new AnchorInterpreter();

        // Simple pre-0.30 IDL with camelCase instruction names
        const pre030Idl = {
            instructions: [
                {
                    accounts: [
                        { isMut: true, isSigner: true, name: 'payer' } as any,
                        { isMut: true, isSigner: false, name: 'account' },
                        { isMut: false, isSigner: false, name: 'systemProgram' },
                    ],
                    args: [{ name: 'accountData', type: 'u64' }],
                    name: 'createAccount',
                },
                {
                    accounts: [
                        { isMut: false, isSigner: true, name: 'authority' } as any,
                        { isMut: true, isSigner: false, name: 'account' },
                    ],
                    args: [{ name: 'newData', type: 'u64' }],
                    name: 'updateAccount',
                },
            ],
            name: 'test_program',
            types: [],
            version: '0.1.0',
        } as any;

        // Simple 0.30+ IDL with snake_case instruction names
        const v030Idl: AnchorIdl = {
            accounts: [
                {
                    discriminator: [1, 2, 3, 4, 5, 6, 7, 8],
                    name: 'MyAccount',
                },
            ],
            address: programId.toBase58(),
            instructions: [
                {
                    accounts: [
                        { name: 'payer', signer: true, writable: true },
                        { name: 'account', signer: false, writable: true },
                        { address: '11111111111111111111111111111111', name: 'system_program' },
                    ],
                    args: [{ name: 'account_data', type: 'u64' }],
                    discriminator: [1, 2, 3, 4, 5, 6, 7, 8],
                    name: 'create_account',
                },
                {
                    accounts: [
                        { name: 'authority', signer: true, writable: false },
                        { name: 'account', signer: false, writable: true },
                    ],
                    args: [{ name: 'new_data', type: 'u64' }],
                    discriminator: [8, 7, 6, 5, 4, 3, 2, 1],
                    name: 'update_account',
                },
            ],
            metadata: {
                name: 'test_program',
                spec: '0.1.0',
                version: '0.1.0',
            },
            types: [
                {
                    name: 'MyAccount',
                    type: {
                        fields: [
                            { name: 'data', type: 'u64' },
                            { name: 'authority', type: 'pubkey' },
                        ],
                        kind: 'struct',
                    },
                },
            ],
        };

        it('should return the IDL from the Anchor program instance', async () => {
            const program = await interpreter.createProgram(connection, wallet, programId, pre030Idl);
            const returnedIdl = program.getIdl();

            // Verify that getIdl() returns the program's IDL
            // @ts-expect-error expect to access private property
            expect(returnedIdl).toBe(program.program.idl);
        });

        it('should preserve the original IDL in the program instance', async () => {
            const program = await interpreter.createProgram(connection, wallet, programId, pre030Idl);

            // Verify that the original IDL is preserved
            expect(program.idl).toBe(pre030Idl);
            expect(program.idl.instructions[0].name).toBe('createAccount');
            expect(program.idl.instructions[1].name).toBe('updateAccount');
        });

        it('should have the program ID set correctly', async () => {
            const program = await interpreter.createProgram(connection, wallet, programId, pre030Idl);

            // Verify the program ID is set
            expect(program.programId.toBase58()).toBe(programId.toBase58());
        });

        it('should handle pre-0.30 IDL format with interpreter', async () => {
            const program = await interpreter.createProgram(connection, wallet, programId, pre030Idl);

            // Verify the program was created successfully
            expect(program).toBeDefined();
            expect(program.programId.toBase58()).toBe(programId.toBase58());

            // The returned IDL should have the expected structure
            const idl = program.getIdl();
            expect(idl).toBeDefined();
            expect(idl.instructions).toBeDefined();
            expect(idl.instructions.length).toBe(2);
        });

        it('should handle 0.30+ IDL format with interpreter', async () => {
            const program = await interpreter.createProgram(connection, wallet, programId, v030Idl);

            // Verify the program was created successfully
            expect(program).toBeDefined();
            expect(program.programId.toBase58()).toBe(programId.toBase58());

            // The returned IDL should have the expected structure
            const idl = program.getIdl();
            expect(idl).toBeDefined();
            expect(idl.instructions).toBeDefined();
            expect(idl.instructions.length).toBe(2);
        });

        it('should maintain consistency between original and program IDL', async () => {
            const program = await interpreter.createProgram(connection, wallet, programId, pre030Idl);

            // Original IDL should be unchanged
            expect(program.idl).toBe(pre030Idl);

            // Program's IDL is what getIdl() returns
            const returnedIdl = program.getIdl();

            // Both should have instructions
            expect(program.idl.instructions).toBeDefined();
            expect(returnedIdl.instructions).toBeDefined();
        });

        it('should verify actual conversion behavior for pre-0.30 IDL', async () => {
            // Create program and check what getIdl() returns
            const program = await interpreter.createProgram(connection, wallet, programId, pre030Idl);
            const returnedIdl = program.getIdl();

            // The actual behavior: getIdl() returns the original camelCase names
            const instructionNames = returnedIdl.instructions.map((ix: any) => ix.name);
            expect(instructionNames).toEqual(['createAccount', 'updateAccount']);

            // Arguments also keep their original camelCase names
            expect(returnedIdl.instructions[0].args[0].name).toBe('accountData');
            expect(returnedIdl.instructions[1].args[0].name).toBe('newData');
        });

        it('should verify actual conversion behavior for 0.30 IDL', async () => {
            // Create program and check what getIdl() returns
            const program = await interpreter.createProgram(connection, wallet, programId, v030Idl);
            const returnedIdl = program.getIdl();

            // The actual behavior: getIdl() also returns camelCase names for 0.30 IDL
            const instructionNames = returnedIdl.instructions.map((ix: any) => ix.name);
            expect(instructionNames).toEqual(['createAccount', 'updateAccount']);

            // Arguments are also converted to camelCase
            expect(returnedIdl.instructions[0].args[0].name).toBe('accountData');
            expect(returnedIdl.instructions[1].args[0].name).toBe('newData');
        });
    });
});
