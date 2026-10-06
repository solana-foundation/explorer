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

        it.each([
            ['pre-0.30', pre030Idl],
            ['0.30+', v030Idl],
        ])('should expose program ID and camelCase instruction and argument names for %s IDL', async (_, idl) => {
            const program = await interpreter.createProgram(connection, wallet, programId, idl);
            const returnedIdl = program.getIdl();

            expect(program.programId.toBase58()).toBe(programId.toBase58());
            expect(returnedIdl.instructions.map((ix: any) => ix.name)).toEqual(['createAccount', 'updateAccount']);
            expect(returnedIdl.instructions.map((ix: any) => ix.args[0].name)).toEqual(['accountData', 'newData']);
        });

        it('should preserve the original IDL and return the Anchor program IDL from getIdl', async () => {
            const program = await interpreter.createProgram(connection, wallet, programId, pre030Idl);

            expect(program.idl).toBe(pre030Idl);
            // @ts-expect-error expect to access private property
            expect(program.getIdl()).toBe(program.program.idl);
        });
    });
});
