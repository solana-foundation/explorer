import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { describe, expect, it, vi } from 'vitest';

import { AnchorInterpreter } from './anchor-interpreter';
import { AnchorUnifiedProgram } from './anchor-program';

describe('AnchorInterpreter', () => {
    const interpreter = new AnchorInterpreter();

    describe('interpreter name', () => {
        it('should have the correct name', () => {
            expect(interpreter.name).toBe('anchor');
        });
    });

    describe('canHandle', () => {
        it.each([
            [
                {
                    address: 'TestProgram11111111111111111111111111111111',
                    instructions: [],
                    metadata: {
                        name: 'test-program',
                        version: '0.1.0',
                    },
                },
                true,
                'modern Anchor IDL with metadata.version',
            ],
            [
                {
                    address: 'TestProgram11111111111111111111111111111111',
                    instructions: [],
                    metadata: {
                        name: 'test-program',
                        spec: '0.1.0',
                    },
                },
                true,
                'modern Anchor IDL with metadata.spec',
            ],
            [
                {
                    address: 'TestProgram11111111111111111111111111111111',
                    instructions: [],
                    metadata: {
                        name: 'test-program',
                        spec: '0.1.0',
                        version: '0.1.0',
                    },
                },
                true,
                'modern Anchor IDL with both version and spec',
            ],
            [
                {
                    instructions: [],
                    name: 'test-program',
                    version: '1.0.0',
                },
                false,
                'legacy Anchor IDL',
            ],
            [null, false, 'null'],
            [undefined, false, 'undefined'],
        ])('should identify whether can handle %s IDL (%s)', (anchorIdl: any, result, _name: string) => {
            expect(interpreter.canHandle(anchorIdl)).toBe(result);
        });
    });

    describe('createInstruction', () => {
        it('should convert string arguments to proper types based on IDL', async () => {
            const mockBuildInstruction = vi.fn().mockResolvedValue({});
            const mockProgram = {
                buildInstruction: mockBuildInstruction,
                getIdl: () => ({
                    instructions: [
                        {
                            accounts: [{ name: 'payer' }, { name: 'tokenAccount' }],
                            args: [
                                { name: 'amount', type: 'u64' },
                                { name: 'flag', type: 'bool' },
                                { name: 'message', type: 'string' },
                                { name: 'authority', type: 'pubkey' },
                            ],
                            name: 'testInstruction',
                        },
                    ],
                }),
            } as unknown as AnchorUnifiedProgram;

            const accounts = {
                payer: '11111111111111111111111111111111',
                tokenAccount: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            };

            const args = ['1000', 'true', 'Hello World', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'];

            await interpreter.createInstruction(mockProgram, 'testInstruction', accounts, args);

            expect(mockBuildInstruction).toHaveBeenCalledWith(
                'testInstruction',
                {
                    payer: new PublicKey('11111111111111111111111111111111'),
                    tokenAccount: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                },
                [new BN('1000'), true, 'Hello World', new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')]
            );
        });

        it('should handle empty string accounts as null', async () => {
            const mockBuildInstruction = vi.fn().mockResolvedValue({});
            const mockProgram = {
                buildInstruction: mockBuildInstruction,
                getIdl: () => ({
                    instructions: [
                        {
                            accounts: [
                                { name: 'payer' },
                                { name: 'optionalAccount', optional: true },
                                { name: 'anotherOptional', optional: true },
                            ],
                            args: [],
                            name: 'testInstruction',
                        },
                    ],
                }),
            } as unknown as AnchorUnifiedProgram;

            const accounts = {
                anotherOptional: '   ',
                optionalAccount: '',
                payer: '11111111111111111111111111111111',
            };

            const args: any[] = [];

            await interpreter.createInstruction(mockProgram, 'testInstruction', accounts, args);

            expect(mockBuildInstruction).toHaveBeenCalledWith(
                'testInstruction',
                {
                    anotherOptional: null,
                    optionalAccount: null,
                    payer: new PublicKey('11111111111111111111111111111111'),
                },
                []
            );
        });

        it('should handle vector and option types', async () => {
            const mockBuildInstruction = vi.fn().mockResolvedValue({});
            const mockProgram = {
                buildInstruction: mockBuildInstruction,
                getIdl: () => ({
                    instructions: [
                        {
                            args: [
                                { name: 'amounts', type: { vec: 'u64' } },
                                { name: 'optionalValue', type: { option: 'u32' } },
                                { name: 'emptyOption', type: { option: 'string' } },
                            ],
                            name: 'complexInstruction',
                        },
                    ],
                }),
            } as unknown as AnchorUnifiedProgram;

            const accounts = {};
            const args = ['[100, 200, 300]', '42', ''];

            await interpreter.createInstruction(mockProgram, 'complexInstruction', accounts, args);

            expect(mockBuildInstruction).toHaveBeenCalledWith('complexInstruction', {}, [
                [new BN('100'), new BN('200'), new BN('300')],
                new BN('42'),
                null,
            ]);
        });

        it('should handle array types', async () => {
            const mockBuildInstruction = vi.fn().mockResolvedValue({});
            const mockProgram = {
                buildInstruction: mockBuildInstruction,
                getIdl: () => ({
                    instructions: [
                        {
                            args: [
                                { name: 'fixedArray', type: { array: ['bool', 3] } },
                                { name: 'pubkeyArray', type: { array: ['pubkey', 2] } },
                            ],
                            name: 'arrayInstruction',
                        },
                    ],
                }),
            } as unknown as AnchorUnifiedProgram;

            const accounts = {};
            const args = [
                '["true", "false", "true"]',
                '["11111111111111111111111111111111", "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"]',
            ];

            await interpreter.createInstruction(mockProgram, 'arrayInstruction', accounts, args);

            expect(mockBuildInstruction).toHaveBeenCalledWith('arrayInstruction', {}, [
                [true, false, true],
                [
                    new PublicKey('11111111111111111111111111111111'),
                    new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                ],
            ]);
        });

        it('should handle all numeric types', async () => {
            const mockBuildInstruction = vi.fn().mockResolvedValue({});
            const mockProgram = {
                buildInstruction: mockBuildInstruction,
                getIdl: () => ({
                    instructions: [
                        {
                            args: [
                                { name: 'u8Val', type: 'u8' },
                                { name: 'u16Val', type: 'u16' },
                                { name: 'u32Val', type: 'u32' },
                                { name: 'u64Val', type: 'u64' },
                                { name: 'u128Val', type: 'u128' },
                                { name: 'i8Val', type: 'i8' },
                                { name: 'i16Val', type: 'i16' },
                                { name: 'i32Val', type: 'i32' },
                                { name: 'i64Val', type: 'i64' },
                                { name: 'i128Val', type: 'i128' },
                            ],
                            name: 'numericInstruction',
                        },
                    ],
                }),
            } as unknown as AnchorUnifiedProgram;

            const accounts = {};
            const args = [
                '255',
                '65535',
                '4294967295',
                '18446744073709551615',
                '340282366920938463463374607431768211455',
                '-128',
                '-32768',
                '-2147483648',
                '-9223372036854775808',
                '-170141183460469231731687303715884105728',
            ];

            await interpreter.createInstruction(mockProgram, 'numericInstruction', accounts, args);

            const expectedArgs = args.map(arg => new BN(arg));
            expect(mockBuildInstruction).toHaveBeenCalledWith('numericInstruction', {}, expectedArgs);
        });

        it('should handle bytes primitive type', async () => {
            const mockBuildInstruction = vi.fn().mockResolvedValue({});
            const mockProgram = {
                buildInstruction: mockBuildInstruction,
                getIdl: () => ({
                    instructions: [
                        {
                            args: [
                                { name: 'data', type: 'bytes' },
                                { name: 'message', type: 'string' },
                            ],
                            name: 'bytesInstruction',
                        },
                    ],
                }),
            } as unknown as AnchorUnifiedProgram;

            const accounts = {};
            const testData = 'Hello, World!';
            const args = [testData, 'test message'];

            await interpreter.createInstruction(mockProgram, 'bytesInstruction', accounts, args);

            expect(mockBuildInstruction).toHaveBeenCalledWith('bytesInstruction', {}, [
                Buffer.from(testData),
                'test message',
            ]);
        });

        it('should handle null and empty arguments', async () => {
            const mockBuildInstruction = vi.fn().mockResolvedValue({});
            const mockProgram = {
                buildInstruction: mockBuildInstruction,
                getIdl: () => ({
                    instructions: [
                        {
                            args: [
                                { name: 'optionalString', type: { option: 'string' } },
                                { name: 'optionalNumber', type: { option: 'u64' } },
                                { name: 'requiredString', type: 'string' },
                            ],
                            name: 'nullableInstruction',
                        },
                    ],
                }),
            } as unknown as AnchorUnifiedProgram;

            const accounts = {};
            const args = [null, '', 'required'];

            await interpreter.createInstruction(mockProgram, 'nullableInstruction', accounts, args);

            expect(mockBuildInstruction).toHaveBeenCalledWith('nullableInstruction', {}, [null, null, 'required']);
        });

        it('should throw error if instruction not found in IDL', async () => {
            const mockProgram = {
                buildInstruction: vi.fn(),
                getIdl: () => ({
                    instructions: [
                        {
                            args: [],
                            name: 'existingInstruction',
                        },
                    ],
                }),
            } as unknown as AnchorUnifiedProgram;

            await expect(interpreter.createInstruction(mockProgram, 'nonExistentInstruction', {}, [])).rejects.toThrow(
                'Instruction definition not found for "nonExistentInstruction"'
            );
        });

        it('should throw error if argument count does not match IDL definition', async () => {
            const mockProgram = {
                buildInstruction: vi.fn(),
                getIdl: () => ({
                    instructions: [
                        {
                            args: [
                                { name: 'arg1', type: 'u64' },
                                { name: 'arg2', type: 'string' },
                            ],
                            name: 'testInstruction',
                        },
                    ],
                }),
            } as unknown as AnchorUnifiedProgram;

            await expect(
                interpreter.createInstruction(mockProgram, 'testInstruction', {}, ['100', '200', 'extra'])
            ).rejects.toThrow('Argument at index 2 not found in instruction definition');
        });

        it('should handle defined types as-is', async () => {
            const mockBuildInstruction = vi.fn().mockResolvedValue({});
            const mockProgram = {
                buildInstruction: mockBuildInstruction,
                getIdl: () => ({
                    instructions: [
                        {
                            args: [{ name: 'customType', type: { defined: 'CustomStruct' } }],
                            name: 'definedTypeInstruction',
                        },
                    ],
                }),
            } as unknown as AnchorUnifiedProgram;

            const accounts = {};
            const customData = Buffer.from('encoded transaction data');
            const args = [customData];

            await interpreter.createInstruction(mockProgram, 'definedTypeInstruction', accounts, args);

            expect(mockBuildInstruction).toHaveBeenCalledWith('definedTypeInstruction', {}, [customData]);
        });

        it('should handle nested vector types', async () => {
            const mockBuildInstruction = vi.fn().mockResolvedValue({});
            const mockProgram = {
                buildInstruction: mockBuildInstruction,
                getIdl: () => ({
                    instructions: [
                        {
                            args: [{ name: 'matrix', type: { vec: { vec: 'u32' } } }],
                            name: 'nestedVectorInstruction',
                        },
                    ],
                }),
            } as unknown as AnchorUnifiedProgram;

            const accounts = {};
            const args = ['[[1, 2, 3], [4, 5, 6]]'];

            await interpreter.createInstruction(mockProgram, 'nestedVectorInstruction', accounts, args);

            expect(mockBuildInstruction).toHaveBeenCalledWith('nestedVectorInstruction', {}, [
                [
                    [new BN('1'), new BN('2'), new BN('3')],
                    [new BN('4'), new BN('5'), new BN('6')],
                ],
            ]);
        });

        it('should handle boolean strings case-insensitively', async () => {
            const mockBuildInstruction = vi.fn().mockResolvedValue({});
            const mockProgram = {
                buildInstruction: mockBuildInstruction,
                getIdl: () => ({
                    instructions: [
                        {
                            args: [
                                { name: 'bool1', type: 'bool' },
                                { name: 'bool2', type: 'bool' },
                                { name: 'bool3', type: 'bool' },
                            ],
                            name: 'boolInstruction',
                        },
                    ],
                }),
            } as unknown as AnchorUnifiedProgram;

            const accounts = {};
            const args = ['true', true, 'false'];

            await interpreter.createInstruction(mockProgram, 'boolInstruction', accounts, args);

            expect(mockBuildInstruction).toHaveBeenCalledWith('boolInstruction', {}, [true, true, false]);
        });
    });
});
