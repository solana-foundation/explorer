import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { describe, expect, it, vi } from 'vitest';

import type { UnifiedWallet } from '../unified-program.d';
import { CodamaInterpreter } from './codama-interpreter';

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
        ])('should identify whether can handle $2 IDL with Codama', (codamaIdl: any, result, _name: string) => {
            expect(interpreter.canHandle(codamaIdl)).toBe(result);
        });
    });

    describe('createProgram', () => {
        it('should throw an error when attempting to create a program', async () => {
            const codamaIdl = {
                name: 'test-program',
                standard: 'codama',
                version: '1.0.0',
            };

            await expect(
                interpreter.createProgram(mockConnection, mockWallet, mockProgramId, codamaIdl)
            ).rejects.toThrow('Codama IDL format is not yet supported for interactive features');
        });
    });

    describe('createInstruction', () => {
        it('should throw an error when attempting to create an instruction', async () => {
            const mockProgram = {} as any;
            const mockAccounts = {};
            const mockArgs: any[] = [];

            await expect(
                interpreter.createInstruction(mockProgram, 'testInstruction', mockAccounts, mockArgs)
            ).rejects.toThrow('Codama IDL format is not yet supported for interactive features');
        });
    });
});
