import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { describe, expect, it, vi } from 'vitest';

import { fromUtf8 } from '@/app/shared/lib/bytes';

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
            const { buildInstruction, program } = mockProgram(
                'testInstruction',
                [
                    { name: 'amount', type: 'u64' },
                    { name: 'flag', type: 'bool' },
                    { name: 'message', type: 'string' },
                    { name: 'authority', type: 'pubkey' },
                ],
                [{ name: 'payer' }, { name: 'tokenAccount' }],
            );

            const accounts = {
                payer: '11111111111111111111111111111111',
                tokenAccount: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            };

            const args = ['1000', 'true', 'Hello World', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'];

            await interpreter.createInstruction(program, 'testInstruction', accounts, args);

            expect(buildInstruction).toHaveBeenCalledWith(
                'testInstruction',
                {
                    payer: new PublicKey('11111111111111111111111111111111'),
                    tokenAccount: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                },
                [new BN('1000'), true, 'Hello World', new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')],
            );
        });

        it('should handle empty string accounts as null', async () => {
            const { buildInstruction, program } = mockProgram(
                'testInstruction',
                [],
                [
                    { name: 'payer' },
                    { name: 'optionalAccount', optional: true },
                    { name: 'anotherOptional', optional: true },
                ],
            );

            const accounts = {
                anotherOptional: '   ',
                optionalAccount: '',
                payer: '11111111111111111111111111111111',
            };

            await interpreter.createInstruction(program, 'testInstruction', accounts, []);

            expect(buildInstruction).toHaveBeenCalledWith(
                'testInstruction',
                {
                    anotherOptional: null,
                    optionalAccount: null,
                    payer: new PublicKey('11111111111111111111111111111111'),
                },
                [],
            );
        });

        const numericValues = [
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

        it.each([
            {
                args: ['[100, 200, 300]', '42', ''],
                expected: [[new BN('100'), new BN('200'), new BN('300')], new BN('42'), null],
                idlArgs: [
                    { name: 'amounts', type: { vec: 'u64' } },
                    { name: 'optionalValue', type: { option: 'u32' } },
                    { name: 'emptyOption', type: { option: 'string' } },
                ],
                title: 'vector and option types',
            },
            {
                args: [
                    '["true", "false", "true"]',
                    '["11111111111111111111111111111111", "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"]',
                ],
                expected: [
                    [true, false, true],
                    [
                        new PublicKey('11111111111111111111111111111111'),
                        new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                    ],
                ],
                idlArgs: [
                    { name: 'fixedArray', type: { array: ['bool', 3] } },
                    { name: 'pubkeyArray', type: { array: ['pubkey', 2] } },
                ],
                title: 'array types',
            },
            {
                args: numericValues,
                expected: numericValues.map(value => new BN(value)),
                idlArgs: ['u8', 'u16', 'u32', 'u64', 'u128', 'i8', 'i16', 'i32', 'i64', 'i128'].map(type => ({
                    name: `${type}Val`,
                    type,
                })),
                title: 'all numeric types',
            },
            {
                args: ['Hello, World!', 'test message'],
                expected: [fromUtf8('Hello, World!'), 'test message'],
                idlArgs: [
                    { name: 'data', type: 'bytes' },
                    { name: 'message', type: 'string' },
                ],
                title: 'bytes primitive type',
            },
            {
                args: [null, '', 'required'],
                expected: [null, null, 'required'],
                idlArgs: [
                    { name: 'optionalString', type: { option: 'string' } },
                    { name: 'optionalNumber', type: { option: 'u64' } },
                    { name: 'requiredString', type: 'string' },
                ],
                title: 'null and empty arguments',
            },
            {
                args: ['encoded transaction data'],
                expected: [fromUtf8('encoded transaction data')],
                idlArgs: [{ name: 'customType', type: { defined: 'CustomStruct' } }],
                title: 'defined types as-is',
            },
            {
                args: ['[[1, 2, 3], [4, 5, 6]]'],
                expected: [
                    [
                        [new BN('1'), new BN('2'), new BN('3')],
                        [new BN('4'), new BN('5'), new BN('6')],
                    ],
                ],
                idlArgs: [{ name: 'matrix', type: { vec: { vec: 'u32' } } }],
                title: 'nested vector types',
            },
            {
                args: ['true', true, 'false'],
                expected: [true, true, false],
                idlArgs: [
                    { name: 'bool1', type: 'bool' },
                    { name: 'bool2', type: 'bool' },
                    { name: 'bool3', type: 'bool' },
                ],
                title: 'boolean strings case-insensitively',
            },
        ])('should handle $title', async ({ args, expected, idlArgs }) => {
            const { buildInstruction, program } = mockProgram('testInstruction', idlArgs);

            await interpreter.createInstruction(program, 'testInstruction', {}, args);

            expect(buildInstruction).toHaveBeenCalledWith('testInstruction', {}, expected);
        });

        it('should throw error if instruction not found in IDL', async () => {
            const { program } = mockProgram('existingInstruction', []);

            await expect(interpreter.createInstruction(program, 'nonExistentInstruction', {}, [])).rejects.toThrow(
                'Instruction definition not found for "nonExistentInstruction"',
            );
        });

        it('should throw error if argument count does not match IDL definition', async () => {
            const { program } = mockProgram('testInstruction', [
                { name: 'arg1', type: 'u64' },
                { name: 'arg2', type: 'string' },
            ]);

            await expect(
                interpreter.createInstruction(program, 'testInstruction', {}, ['100', '200', 'extra']),
            ).rejects.toThrow('Argument at index 2 not found in instruction definition');
        });
    });
});

function mockProgram(name: string, args: unknown[], accounts: unknown[] = []) {
    const buildInstruction = vi.fn().mockResolvedValue({});
    const program = {
        buildInstruction,
        getIdl: () => ({ instructions: [{ accounts, args, name }] }),
    } as unknown as AnchorUnifiedProgram;
    return { buildInstruction, program };
}
