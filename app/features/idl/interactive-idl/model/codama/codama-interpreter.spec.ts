import { gen } from '@__fixtures__/gen';
import { Connection, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it, vi } from 'vitest';

import systemProgramIdl from '../__mocks__/codama/system-program-idl.json';
import type { BaseIdl, UnifiedWallet } from '../unified-program.d';
import { CodamaInterpreter } from './codama-interpreter';
import { CodamaUnifiedProgram } from './codama-program';

const idl = systemProgramIdl as BaseIdl;

describe('CodamaInterpreter', () => {
    const interpreter = new CodamaInterpreter();

    const mockWallet: UnifiedWallet = {
        publicKey: PublicKey.default,
        signAllTransactions: vi.fn(),
        signTransaction: vi.fn(),
    };

    const mockConnection = new Connection('http://mainnet.rpc.address');
    const mockProgramId = SystemProgram.programId;

    describe('interpreter name', () => {
        it('should have the correct name', () => {
            expect(interpreter.name).toBe('codama');
        });
    });

    describe('canHandle', () => {
        it.each([
            [
                {
                    name: 'test-program',
                    nodes: [],
                    standard: 'codama',
                    version: '1.0.0',
                },
                true,
                'Codama',
            ],
            [
                {
                    accounts: [],
                    instructions: [],
                    name: 'test-program',
                    version: '0.1.0',
                },
                false,
                'Anchor',
            ],
            [
                {
                    instructions: [],
                    metadata: {
                        spec: 'legacy',
                    },
                    name: 'test-program',
                },
                false,
                'Other',
            ],
            [
                {
                    name: 'test-program',
                    version: '1.0.0',
                },
                false,
                'standardless',
            ],
            [
                {
                    name: 'test-program',
                    standard: 'anchor',
                    version: '1.0.0',
                },
                false,
                'different standard',
            ],
            [null, false, 'null'],
            [undefined, false, 'undefined'],
            [42, false, 'number'],
            ['string', false, 'string'],
            [true, false, 'boolean'],
            [[], false, 'array'],
            [{ unrelated: 'shape' }, false, 'unrelated object'],
        ])('should identify whether can handle $2 IDL with Codama', (codamaIdl: unknown, result, _name: string) => {
            expect(interpreter.canHandle(codamaIdl)).toBe(result);
        });
    });

    describe('createProgram', () => {
        it('should create a CodamaUnifiedProgram from a valid Codama IDL', async () => {
            const program = await interpreter.createProgram(mockConnection, mockWallet, mockProgramId, idl);

            expect(program).toBeInstanceOf(CodamaUnifiedProgram);
            expect(program.programId).toEqual(mockProgramId);
            expect(program.getClient()).toBeDefined();
            expect(program.getClient().instructions.size).toBeGreaterThan(0);
        });

        it('should accept a string programId', async () => {
            const programIdStr = PublicKey.default.toBase58();

            const program = await interpreter.createProgram(mockConnection, mockWallet, programIdStr, idl);

            expect(program.programId.toBase58()).toBe(programIdStr);
        });
    });

    describe('createInstruction', () => {
        it('should build a transferSol instruction', async () => {
            const program = await interpreter.createProgram(mockConnection, mockWallet, mockProgramId, idl);

            const ix = await interpreter.createInstruction(
                program,
                'transferSol',
                { destination: gen.address(2), source: gen.address(1) },
                ['1000000000'], // amount as positional string arg
            );

            expect(ix).toBeDefined();
            expect(ix).toBeInstanceOf(TransactionInstruction);
            const txIx = ix as TransactionInstruction;
            expect(txIx.programId.toBase58()).toBe(PublicKey.default.toBase58());
            expect(txIx.keys).toHaveLength(2);
            expect(txIx.data.length).toBeGreaterThan(0);
        });

        it('should throw for unknown instruction names', async () => {
            const program = await interpreter.createProgram(mockConnection, mockWallet, mockProgramId, idl);

            await expect(interpreter.createInstruction(program, 'nonExistentInstruction', {}, [])).rejects.toThrow(
                'not found',
            );
        });
    });

    describe('account normalization', () => {
        it.each([
            ['empty string', ''],
            ['whitespace-only', '   '],
        ])('should normalize %s account to null', async (_, destination) => {
            const program = await interpreter.createProgram(mockConnection, mockWallet, mockProgramId, idl);

            await expect(
                interpreter.createInstruction(program, 'transferSol', { destination, source: gen.address(1) }, [
                    '1000',
                ]),
            ).rejects.toThrow();
        });

        it('should throw descriptive error for invalid public key', async () => {
            const program = await interpreter.createProgram(mockConnection, mockWallet, mockProgramId, idl);

            await expect(
                interpreter.createInstruction(
                    program,
                    'transferSol',
                    { destination: 'not-a-valid-pubkey!!!', source: gen.address(1) },
                    ['1000'],
                ),
            ).rejects.toThrow('Invalid public key for account "destination"');
        });

        it('should accept PublicKey objects directly', async () => {
            const program = await interpreter.createProgram(mockConnection, mockWallet, mockProgramId, idl);

            const source = gen.publicKey(1);
            const destination = gen.publicKey(2);

            const ix = await interpreter.createInstruction(program, 'transferSol', { destination, source } as any, [
                '1000',
            ]);
            expect(ix).toBeInstanceOf(TransactionInstruction);
        });
    });
});
