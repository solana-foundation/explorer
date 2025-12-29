import { describe, expect, it } from 'vitest';

import type { AccountFormValueMap } from '../use-instruction-form';
import { flattenNestedRecord } from '../use-instruction-form';

describe('useInstructionForm', () => {
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
