import { PublicKey } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { buildSeedsWithInfo } from '../seed-builder';
import type { PdaInstruction, PdaSeed } from '../types';

// Common test fixtures
const EMPTY_INSTRUCTION: PdaInstruction = { accounts: [], args: [], name: 'test' };
const DEFAULT_PUBKEY = PublicKey.default.toBase58();

// UTF-8 string to bytes mapping
const UTF8_TEST_CASES: Record<string, number[]> = {
    hello: [104, 101, 108, 108, 111],
    test: [116, 101, 115, 116],
};

// Const seed test cases: { value (bytes), expectedHex }
const CONST_SEED_TEST_CASES: Array<{ value: number[]; expectedHex: string }> = [
    { expectedHex: '0xdeadbeef', value: [0xde, 0xad, 0xbe, 0xef] },
    { expectedHex: '0x0102', value: [0x01, 0x02] },
    { expectedHex: '0xff', value: [0xff] },
];

// Integer encoding test cases: { input, type, expectedBytes }
const INTEGER_TEST_CASES: Array<{ expected: number[]; input: string; type: string }> = [
    { expected: [42], input: '42', type: 'u8' },
    { expected: [0xe8, 0x03], input: '1000', type: 'u16' },
    { expected: [0, 0, 0, 1], input: '16777216', type: 'u32' },
    { expected: [0, 1, 0, 0, 0, 0, 0, 0], input: '256', type: 'u64' },
    { expected: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], input: '1', type: 'u128' },
    { expected: [255, 255, 255, 255, 255, 255, 255, 255], input: '18446744073709551615', type: 'u64' },
];

// Signed integer test cases
const SIGNED_INTEGER_TEST_CASES: Array<{ expectedLength: number; input: string; type: string }> = [
    { expectedLength: 1, input: '127', type: 'i8' },
    { expectedLength: 2, input: '256', type: 'i16' },
    { expectedLength: 4, input: '256', type: 'i32' },
    { expectedLength: 8, input: '256', type: 'i64' },
    { expectedLength: 16, input: '256', type: 'i128' },
];

// String/bytes arg test cases
const STRING_BYTES_TEST_CASES: Array<{ input: string; type: string }> = [
    { input: 'hello', type: 'string' },
    { input: 'test', type: 'bytes' },
];

// Invalid account test cases
const INVALID_ACCOUNT_TEST_CASES: Array<{ description: string; value: string | undefined }> = [
    { description: 'invalid PublicKey', value: 'invalid-pubkey' },
    { description: 'empty string', value: '' },
];

describe('seed-builder', () => {
    describe('buildSeedsWithInfo', () => {
        describe('const seeds', () => {
            it.each(CONST_SEED_TEST_CASES)(
                'should build const seed and return hex info "$expectedHex"',
                ({ value, expectedHex }) => {
                    const seeds: PdaSeed[] = [{ kind: 'const', value }];

                    const result = buildSeedsWithInfo(seeds, {}, {}, EMPTY_INSTRUCTION);

                    expect(result.buffers).not.toBeNull();
                    expect(Array.from(result.buffers![0])).toEqual(value);
                    expect(result.info[0].name).toBe(expectedHex);
                    expect(result.info[0].value).toBe(expectedHex);
                }
            );

            it('should return null buffer when const seed has no value', () => {
                const seeds: PdaSeed[] = [{ kind: 'const' }];

                const result = buildSeedsWithInfo(seeds, {}, {}, EMPTY_INSTRUCTION);

                expect(result.buffers).toBeNull();
                expect(result.info[0].name).toBe('const');
                expect(result.info[0].value).toBeNull();
            });
        });

        describe('arg seeds with integer types', () => {
            it.each(INTEGER_TEST_CASES)(
                'should encode $type "$input" as little-endian bytes',
                ({ input, type, expected }) => {
                    const seeds: PdaSeed[] = [{ kind: 'arg', path: 'value' }];
                    const instruction: PdaInstruction = {
                        accounts: [],
                        args: [{ name: 'value', type }],
                        name: 'test',
                    };

                    const result = buildSeedsWithInfo(seeds, { value: input }, {}, instruction);

                    expect(result.buffers).not.toBeNull();
                    expect(Array.from(result.buffers![0])).toEqual(expected);
                }
            );

            it.each(SIGNED_INTEGER_TEST_CASES)(
                'should encode $type with correct byte length ($expectedLength)',
                ({ input, type, expectedLength }) => {
                    const seeds: PdaSeed[] = [{ kind: 'arg', path: 'value' }];
                    const instruction: PdaInstruction = {
                        accounts: [],
                        args: [{ name: 'value', type }],
                        name: 'test',
                    };

                    const result = buildSeedsWithInfo(seeds, { value: input }, {}, instruction);

                    expect(result.buffers).not.toBeNull();
                    expect(result.buffers![0].length).toBe(expectedLength);
                }
            );
        });

        describe('arg seeds with string/bytes types', () => {
            it.each(STRING_BYTES_TEST_CASES)('should build $type arg seed as UTF-8 bytes', ({ input, type }) => {
                const seeds: PdaSeed[] = [{ kind: 'arg', path: 'data' }];
                const instruction: PdaInstruction = {
                    accounts: [],
                    args: [{ name: 'data', type }],
                    name: 'test',
                };

                const result = buildSeedsWithInfo(seeds, { data: input }, {}, instruction);

                expect(result.buffers).not.toBeNull();
                expect(Array.from(result.buffers![0])).toEqual(UTF8_TEST_CASES[input]);
            });
        });

        describe('account seeds', () => {
            it('should build account seed from PublicKey', () => {
                const seeds: PdaSeed[] = [{ kind: 'account', path: 'owner' }];

                const result = buildSeedsWithInfo(seeds, {}, { owner: DEFAULT_PUBKEY }, EMPTY_INSTRUCTION);

                expect(result.buffers).not.toBeNull();
                expect(result.buffers![0].length).toBe(32);
                expect(result.info[0].name).toBe('owner');
                expect(result.info[0].value).toBe(DEFAULT_PUBKEY);
            });

            it.each(INVALID_ACCOUNT_TEST_CASES)(
                'should return null buffer for $description',
                ({ value, description }) => {
                    const seeds: PdaSeed[] = [{ kind: 'account', path: 'owner' }];
                    const accounts = value !== undefined ? { owner: value } : {};

                    const result = buildSeedsWithInfo(seeds, {}, accounts, EMPTY_INSTRUCTION);

                    expect(result.buffers).toBeNull();
                    expect(result.info[0].name).toBe('owner');
                }
            );

            it('should return null buffer for missing account', () => {
                const seeds: PdaSeed[] = [{ kind: 'account', path: 'owner' }];

                const result = buildSeedsWithInfo(seeds, {}, {}, EMPTY_INSTRUCTION);

                expect(result.buffers).toBeNull();
                expect(result.info[0].name).toBe('owner');
                expect(result.info[0].value).toBeNull();
            });
        });

        describe('multiple seeds', () => {
            it('should build multiple seed buffers in order', () => {
                const seeds: PdaSeed[] = [
                    { kind: 'const', value: [0x01, 0x02] },
                    { kind: 'arg', path: 'index' },
                    { kind: 'account', path: 'user' },
                ];
                const instruction: PdaInstruction = {
                    accounts: [],
                    args: [{ name: 'index', type: 'u8' }],
                    name: 'test',
                };

                const result = buildSeedsWithInfo(seeds, { index: '5' }, { user: DEFAULT_PUBKEY }, instruction);

                expect(result.buffers).not.toBeNull();
                expect(result.buffers!.length).toBe(3);
                expect(Array.from(result.buffers![0])).toEqual([0x01, 0x02]);
                expect(Array.from(result.buffers![1])).toEqual([5]);
                expect(result.buffers![2].length).toBe(32);
            });

            it('should return null buffers if any seed fails', () => {
                const seeds: PdaSeed[] = [
                    { kind: 'const', value: [0x01] },
                    { kind: 'arg', path: 'missing' },
                ];
                const instruction: PdaInstruction = {
                    accounts: [],
                    args: [{ name: 'missing', type: 'u64' }],
                    name: 'test',
                };

                const result = buildSeedsWithInfo(seeds, {}, {}, instruction);

                expect(result.buffers).toBeNull();
                expect(result.info.length).toBe(2);
            });
        });

        describe('camelCase path handling', () => {
            it('should handle snake_case arg paths', () => {
                const seeds: PdaSeed[] = [{ kind: 'arg', path: 'poll_id' }];
                const instruction: PdaInstruction = {
                    accounts: [],
                    args: [{ name: 'poll_id', type: 'u64' }],
                    name: 'test',
                };

                const result = buildSeedsWithInfo(seeds, { pollId: '100' }, {}, instruction);

                expect(result.buffers).not.toBeNull();
                expect(result.info[0].name).toBe('pollId');
            });

            it('should handle snake_case account paths', () => {
                const seeds: PdaSeed[] = [{ kind: 'account', path: 'token_owner' }];

                const result = buildSeedsWithInfo(seeds, {}, { tokenOwner: DEFAULT_PUBKEY }, EMPTY_INSTRUCTION);

                expect(result.buffers).not.toBeNull();
                expect(result.info[0].name).toBe('tokenOwner');
            });
        });

        describe('edge cases', () => {
            it('should handle empty seeds array', () => {
                const result = buildSeedsWithInfo([], {}, {}, EMPTY_INSTRUCTION);

                expect(result.buffers).not.toBeNull();
                expect(result.buffers!.length).toBe(0);
                expect(result.info.length).toBe(0);
            });

            it('should handle unknown seed kind', () => {
                const seeds: PdaSeed[] = [{ kind: 'unknown' as any }];

                const result = buildSeedsWithInfo(seeds, {}, {}, EMPTY_INSTRUCTION);

                expect(result.buffers).toBeNull();
                expect(result.info[0].name).toBe('unknown');
            });

            it('should handle invalid number in arg', () => {
                const seeds: PdaSeed[] = [{ kind: 'arg', path: 'value' }];
                const instruction: PdaInstruction = {
                    accounts: [],
                    args: [{ name: 'value', type: 'u64' }],
                    name: 'test',
                };

                const result = buildSeedsWithInfo(seeds, { value: 'not-a-number' }, {}, instruction);

                expect(result.buffers).toBeNull();
            });
        });
    });
});
