// @vitest-environment jsdom
import type { InstructionData } from '@entities/idl';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AccountFormValueMap } from '../use-instruction-form';
import { flattenNestedRecord, useInstructionForm } from '../use-instruction-form';

describe('useInstructionForm', () => {
    describe('default values', () => {
        afterEach(() => {
            // Keep a regression in one case from polluting the next case and the rest of the worker.
            delete (Object.prototype as Record<string, unknown>).pollutedArg;
            delete (Object as unknown as Record<string, unknown>).pollutedArg;
        });

        it.each(['__proto__', 'constructor'])(
            'should not write argument defaults onto shared objects for instruction named %s',
            name => {
                const instruction: InstructionData = {
                    accounts: [],
                    args: [{ docs: [], name: 'pollutedArg', type: 'u64' }],
                    docs: [],
                    name,
                };

                renderHook(() => useInstructionForm({ instruction, onSubmit: vi.fn() }));

                expect(Object.hasOwn(Object.prototype, 'pollutedArg')).toBe(false);
                expect(Object.hasOwn(Object, 'pollutedArg')).toBe(false);
            },
        );
    });

    describe('flattenNestedRecord', () => {
        describe('flat records (single level)', () => {
            it('should flatten a simple flat record', () => {
                const input: Record<string, AccountFormValueMap> = {
                    instructionName: {
                        accountName: 'value1',
                        anotherAccount: '',
                    },
                };

                const result = flattenNestedRecord(input);

                expect(result).toEqual({
                    'instructionName.accountName': 'value1',
                    'instructionName.anotherAccount': '',
                });
            });
        });

        describe('nested records (2 levels)', () => {
            it('should flatten nested account groups', () => {
                const input: Record<string, AccountFormValueMap> = {
                    instructionName: {
                        accountGroup: {
                            anotherNested: 'anotherValue',
                            nestedAccount: 'nestedValue',
                        },
                    },
                };

                const result = flattenNestedRecord(input);

                expect(result).toEqual({
                    'instructionName.accountGroup.anotherNested': 'anotherValue',
                    'instructionName.accountGroup.nestedAccount': 'nestedValue',
                });
            });
        });
    });
});
