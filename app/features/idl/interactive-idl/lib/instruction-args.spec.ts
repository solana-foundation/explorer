import type { ArgField } from '@entities/idl';
import { describe, expect, it } from 'vitest';

import { isRequiredArg } from './instruction-args';

describe('isRequiredArg', () => {
    describe('required arguments', () => {
        it('should return true for simple types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'amount',
                type: 'u64',
            };
            expect(isRequiredArg(arg)).toBe(true);
        });

        it('should return true for complex types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'data',
                type: 'Vec<u8>',
            };
            expect(isRequiredArg(arg)).toBe(true);
        });

        it('should return true for custom struct types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'config',
                type: 'MyStruct',
            };
            expect(isRequiredArg(arg)).toBe(true);
        });

        it('should return true for types containing "option" but not starting with it', () => {
            const arg: ArgField = {
                docs: [],
                name: 'value',
                type: 'MyOptionType',
            };
            expect(isRequiredArg(arg)).toBe(true);
        });

        it('should return true for types with "option" in the middle', () => {
            const arg: ArgField = {
                docs: [],
                name: 'value',
                type: 'Vec<option(u64)>',
            };
            expect(isRequiredArg(arg)).toBe(true);
        });
    });

    describe('optional arguments', () => {
        it('should return false for option(u64)', () => {
            const arg: ArgField = {
                docs: [],
                name: 'amount',
                type: 'option(u64)',
            };
            expect(isRequiredArg(arg)).toBe(false);
        });

        it('should return false for option(string)', () => {
            const arg: ArgField = {
                docs: [],
                name: 'name',
                type: 'option(string)',
            };
            expect(isRequiredArg(arg)).toBe(false);
        });

        it('should return false for option(publicKey)', () => {
            const arg: ArgField = {
                docs: [],
                name: 'owner',
                type: 'option(publicKey)',
            };
            expect(isRequiredArg(arg)).toBe(false);
        });

        it('should return false for nested option types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'config',
                type: 'option(MyStruct)',
            };
            expect(isRequiredArg(arg)).toBe(false);
        });

        it('should return false for coption(u64)', () => {
            const arg: ArgField = {
                docs: [],
                name: 'amount',
                type: 'coption(u64)',
            };
            expect(isRequiredArg(arg)).toBe(false);
        });

        it('should return false for coption(string)', () => {
            const arg: ArgField = {
                docs: [],
                name: 'name',
                type: 'coption(string)',
            };
            expect(isRequiredArg(arg)).toBe(false);
        });

        it('should return false for coption(publicKey)', () => {
            const arg: ArgField = {
                docs: [],
                name: 'owner',
                type: 'coption(publicKey)',
            };
            expect(isRequiredArg(arg)).toBe(false);
        });

        it('should return false for nested coption types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'config',
                type: 'coption(MyStruct)',
            };
            expect(isRequiredArg(arg)).toBe(false);
        });
    });

    describe('edge cases', () => {
        it('should return true for empty string type', () => {
            const arg: ArgField = {
                docs: [],
                name: 'value',
                type: '',
            };
            expect(isRequiredArg(arg)).toBe(true);
        });

        it('should handle case sensitivity correctly', () => {
            const arg: ArgField = {
                docs: [],
                name: 'value',
                type: 'Option(u64)',
            };
            expect(isRequiredArg(arg)).toBe(true);
        });

        it('should handle COption case sensitivity', () => {
            const arg: ArgField = {
                docs: [],
                name: 'value',
                type: 'COption(u64)',
            };
            expect(isRequiredArg(arg)).toBe(true);
        });
    });
});
