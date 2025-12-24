import { describe, expect, it } from 'vitest';

import { buildSeedsWithInfo } from '../seed-builder';
import type { PdaInstruction, PdaSeed } from '../types';

describe('seed-builder - Buffer operations', () => {
    describe('buildSeedsWithInfo', () => {
        describe('const seeds', () => {
            it('should build const seed buffer from string value', () => {
                const seeds: PdaSeed[] = [{ kind: 'const', value: [104, 101, 108, 108, 111] }]; // "hello" as bytes
                const instruction: PdaInstruction = { accounts: [], args: [], name: 'test' };

                const result = buildSeedsWithInfo(seeds, {}, {}, instruction);

                expect(result.buffers).not.toBeNull();
                expect(result.buffers!.length).toBe(1);
                // "hello" = [104, 101, 108, 108, 111]
                expect(Array.from(result.buffers![0])).toEqual([104, 101, 108, 108, 111]);
            });

            it('should return hex value in info for const seed', () => {
                const seeds: PdaSeed[] = [{ kind: 'const', value: [0xde, 0xad, 0xbe, 0xef] }];
                const instruction: PdaInstruction = { accounts: [], args: [], name: 'test' };

                const result = buildSeedsWithInfo(seeds, {}, {}, instruction);

                expect(result.info[0].name).toBe('0xdeadbeef');
                expect(result.info[0].value).toBe('0xdeadbeef');
            });

            it('should return null buffer when const seed has no value', () => {
                const seeds: PdaSeed[] = [{ kind: 'const' }];
                const instruction: PdaInstruction = { accounts: [], args: [], name: 'test' };

                const result = buildSeedsWithInfo(seeds, {}, {}, instruction);

                expect(result.buffers).toBeNull();
                expect(result.info[0].name).toBe('const');
                expect(result.info[0].value).toBeNull();
            });
        });

        describe('arg seeds with integer types', () => {
            it('should build u64 arg seed with little-endian encoding', () => {
                const seeds: PdaSeed[] = [{ kind: 'arg', path: 'amount' }];
                const instruction: PdaInstruction = {
                    accounts: [],
                    args: [{ name: 'amount', type: 'u64' }],
                    name: 'test',
                };
                const args = { amount: '256' };

                const result = buildSeedsWithInfo(seeds, args, {}, instruction);

                expect(result.buffers).not.toBeNull();
                expect(result.buffers!.length).toBe(1);
                // 256 as u64 LE = [0, 1, 0, 0, 0, 0, 0, 0]
                expect(Array.from(result.buffers![0])).toEqual([0, 1, 0, 0, 0, 0, 0, 0]);
            });

            it('should build u8 arg seed', () => {
                const seeds: PdaSeed[] = [{ kind: 'arg', path: 'index' }];
                const instruction: PdaInstruction = {
                    accounts: [],
                    args: [{ name: 'index', type: 'u8' }],
                    name: 'test',
                };
                const args = { index: '42' };

                const result = buildSeedsWithInfo(seeds, args, {}, instruction);

                expect(result.buffers).not.toBeNull();
                expect(Array.from(result.buffers![0])).toEqual([42]);
            });

            it('should build u16 arg seed with little-endian encoding', () => {
                const seeds: PdaSeed[] = [{ kind: 'arg', path: 'value' }];
                const instruction: PdaInstruction = {
                    accounts: [],
                    args: [{ name: 'value', type: 'u16' }],
                    name: 'test',
                };
                const args = { value: '1000' };

                const result = buildSeedsWithInfo(seeds, args, {}, instruction);

                expect(result.buffers).not.toBeNull();
                // 1000 = 0x03E8, LE = [0xE8, 0x03]
                expect(Array.from(result.buffers![0])).toEqual([0xe8, 0x03]);
            });

            it('should build u32 arg seed with little-endian encoding', () => {
                const seeds: PdaSeed[] = [{ kind: 'arg', path: 'id' }];
                const instruction: PdaInstruction = {
                    accounts: [],
                    args: [{ name: 'id', type: 'u32' }],
                    name: 'test',
                };
                const args = { id: '16777216' }; // 0x01000000

                const result = buildSeedsWithInfo(seeds, args, {}, instruction);

                expect(result.buffers).not.toBeNull();
                // 16777216 = 0x01000000, LE = [0, 0, 0, 1]
                expect(Array.from(result.buffers![0])).toEqual([0, 0, 0, 1]);
            });

            it('should build u128 arg seed with little-endian encoding', () => {
                const seeds: PdaSeed[] = [{ kind: 'arg', path: 'bigValue' }];
                const instruction: PdaInstruction = {
                    accounts: [],
                    args: [{ name: 'bigValue', type: 'u128' }],
                    name: 'test',
                };
                const args = { bigValue: '1' };

                const result = buildSeedsWithInfo(seeds, args, {}, instruction);

                expect(result.buffers).not.toBeNull();
                expect(result.buffers![0].length).toBe(16);
                // 1 as u128 LE = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                expect(Array.from(result.buffers![0])).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            });

            it('should handle signed integer types (i64)', () => {
                const seeds: PdaSeed[] = [{ kind: 'arg', path: 'offset' }];
                const instruction: PdaInstruction = {
                    accounts: [],
                    args: [{ name: 'offset', type: 'i64' }],
                    name: 'test',
                };
                const args = { offset: '256' };

                const result = buildSeedsWithInfo(seeds, args, {}, instruction);

                expect(result.buffers).not.toBeNull();
                expect(result.buffers![0].length).toBe(8);
            });
        });

        describe('arg seeds with string/bytes types', () => {
            it('should build string arg seed as UTF-8 buffer', () => {
                const seeds: PdaSeed[] = [{ kind: 'arg', path: 'name' }];
                const instruction: PdaInstruction = {
                    accounts: [],
                    args: [{ name: 'name', type: 'string' }],
                    name: 'test',
                };
                const args = { name: 'hello' };

                const result = buildSeedsWithInfo(seeds, args, {}, instruction);

                expect(result.buffers).not.toBeNull();
                // "hello" = [104, 101, 108, 108, 111]
                expect(Array.from(result.buffers![0])).toEqual([104, 101, 108, 108, 111]);
            });

            it('should build bytes arg seed', () => {
                const seeds: PdaSeed[] = [{ kind: 'arg', path: 'data' }];
                const instruction: PdaInstruction = {
                    accounts: [],
                    args: [{ name: 'data', type: 'bytes' }],
                    name: 'test',
                };
                const args = { data: 'test' };

                const result = buildSeedsWithInfo(seeds, args, {}, instruction);

                expect(result.buffers).not.toBeNull();
                expect(Array.from(result.buffers![0])).toEqual([116, 101, 115, 116]); // "test"
            });
        });

        describe('account seeds', () => {
            it('should build account seed from PublicKey', () => {
                const seeds: PdaSeed[] = [{ kind: 'account', path: 'owner' }];
                const instruction: PdaInstruction = { accounts: [], args: [], name: 'test' };
                const pubkey = '11111111111111111111111111111111'; // System program

                const result = buildSeedsWithInfo(seeds, {}, { owner: pubkey }, instruction);

                expect(result.buffers).not.toBeNull();
                expect(result.buffers![0].length).toBe(32);
                expect(result.info[0].name).toBe('owner');
                expect(result.info[0].value).toBe(pubkey);
            });

            it('should return null buffer for invalid PublicKey', () => {
                const seeds: PdaSeed[] = [{ kind: 'account', path: 'owner' }];
                const instruction: PdaInstruction = { accounts: [], args: [], name: 'test' };

                const result = buildSeedsWithInfo(seeds, {}, { owner: 'invalid-pubkey' }, instruction);

                expect(result.buffers).toBeNull();
                expect(result.info[0].name).toBe('owner');
                expect(result.info[0].value).toBe('invalid-pubkey');
            });

            it('should return null buffer for missing account', () => {
                const seeds: PdaSeed[] = [{ kind: 'account', path: 'owner' }];
                const instruction: PdaInstruction = { accounts: [], args: [], name: 'test' };

                const result = buildSeedsWithInfo(seeds, {}, {}, instruction);

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
                const args = { index: '5' };
                const accounts = { user: '11111111111111111111111111111111' };

                const result = buildSeedsWithInfo(seeds, args, accounts, instruction);

                expect(result.buffers).not.toBeNull();
                expect(result.buffers!.length).toBe(3);
                expect(Array.from(result.buffers![0])).toEqual([0x01, 0x02]);
                expect(Array.from(result.buffers![1])).toEqual([5]);
                expect(result.buffers![2].length).toBe(32);
            });

            it('should return null buffers if any seed fails', () => {
                const seeds: PdaSeed[] = [
                    { kind: 'const', value: [0x01] },
                    { kind: 'arg', path: 'missing' }, // This will fail - no value provided
                ];
                const instruction: PdaInstruction = {
                    accounts: [],
                    args: [{ name: 'missing', type: 'u64' }],
                    name: 'test',
                };

                const result = buildSeedsWithInfo(seeds, {}, {}, instruction);

                expect(result.buffers).toBeNull();
                // Info should still contain all seeds
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
                const args = { pollId: '100' }; // camelCase in args

                const result = buildSeedsWithInfo(seeds, args, {}, instruction);

                expect(result.buffers).not.toBeNull();
                expect(result.info[0].name).toBe('pollId');
            });

            it('should handle snake_case account paths', () => {
                const seeds: PdaSeed[] = [{ kind: 'account', path: 'token_owner' }];
                const instruction: PdaInstruction = { accounts: [], args: [], name: 'test' };
                const accounts = { tokenOwner: '11111111111111111111111111111111' }; // camelCase

                const result = buildSeedsWithInfo(seeds, {}, accounts, instruction);

                expect(result.buffers).not.toBeNull();
                expect(result.info[0].name).toBe('tokenOwner');
            });
        });

        describe('edge cases', () => {
            it('should handle empty seeds array', () => {
                const instruction: PdaInstruction = { accounts: [], args: [], name: 'test' };

                const result = buildSeedsWithInfo([], {}, {}, instruction);

                expect(result.buffers).not.toBeNull();
                expect(result.buffers!.length).toBe(0);
                expect(result.info.length).toBe(0);
            });

            it('should handle unknown seed kind', () => {
                const seeds: PdaSeed[] = [{ kind: 'unknown' as any }];
                const instruction: PdaInstruction = { accounts: [], args: [], name: 'test' };

                const result = buildSeedsWithInfo(seeds, {}, {}, instruction);

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
                const args = { value: 'not-a-number' };

                const result = buildSeedsWithInfo(seeds, args, {}, instruction);

                expect(result.buffers).toBeNull();
            });

            it('should handle large u64 values correctly', () => {
                const seeds: PdaSeed[] = [{ kind: 'arg', path: 'amount' }];
                const instruction: PdaInstruction = {
                    accounts: [],
                    args: [{ name: 'amount', type: 'u64' }],
                    name: 'test',
                };
                // Max u64 value
                const args = { amount: '18446744073709551615' };

                const result = buildSeedsWithInfo(seeds, args, {}, instruction);

                expect(result.buffers).not.toBeNull();
                expect(result.buffers![0].length).toBe(8);
                // Max u64 LE bytes
                expect(Array.from(result.buffers![0])).toEqual([255, 255, 255, 255, 255, 255, 255, 255]);
            });
        });
    });
});
