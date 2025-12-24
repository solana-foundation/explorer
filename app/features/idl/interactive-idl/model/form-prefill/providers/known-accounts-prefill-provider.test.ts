import type { InstructionData } from '@entities/idl';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useInstructionForm } from '../../use-instruction-form';
import { createKnownAccountsPrefillDependency } from './known-accounts-prefill-provider';

describe('createKnownAccountsPrefillDependency', () => {
    it('should fill system program account', () => {
        const instruction: InstructionData = {
            accounts: [
                {
                    docs: [],
                    name: 'systemProgram',
                    optional: false,
                    signer: false,
                },
            ],
            args: [],
            docs: [],
            name: 'testInstruction',
        };

        const { result } = renderHook(() =>
            useInstructionForm({
                instruction,
                onSubmit: vi.fn(),
            })
        );
        const { form, fieldNames } = result.current;

        const dependency = createKnownAccountsPrefillDependency(instruction, {
            account: fieldNames.account,
        });

        dependency.onValueChange(instruction.name, form);

        expect(form.getValues('accounts.testInstruction.systemProgram')).toBe('11111111111111111111111111111111');
    });

    it('should fill token program account', () => {
        const instruction: InstructionData = {
            accounts: [
                {
                    docs: [],
                    name: 'tokenProgram',
                    optional: false,
                    signer: false,
                },
            ],
            args: [],
            docs: [],
            name: 'testInstruction',
        };

        const { result } = renderHook(() =>
            useInstructionForm({
                instruction,
                onSubmit: vi.fn(),
            })
        );
        const { form, fieldNames } = result.current;

        const dependency = createKnownAccountsPrefillDependency(instruction, {
            account: fieldNames.account,
        });

        dependency.onValueChange(instruction.name, form);

        expect(form.getValues('accounts.testInstruction.tokenProgram')).toBe(
            'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
        );
    });

    it('should fill associated token program account', () => {
        const instruction: InstructionData = {
            accounts: [
                {
                    docs: [],
                    name: 'associatedTokenProgram',
                    optional: false,
                    signer: false,
                },
            ],
            args: [],
            docs: [],
            name: 'testInstruction',
        };

        const { result } = renderHook(() =>
            useInstructionForm({
                instruction,
                onSubmit: vi.fn(),
            })
        );
        const { form, fieldNames } = result.current;

        const dependency = createKnownAccountsPrefillDependency(instruction, {
            account: fieldNames.account,
        });

        dependency.onValueChange(instruction.name, form);

        expect(form.getValues('accounts.testInstruction.associatedTokenProgram')).toBe(
            'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
        );
    });

    it('should match account names case-insensitively', () => {
        const instruction: InstructionData = {
            accounts: [
                {
                    docs: [],
                    name: 'SYSTEM_PROGRAM',
                    optional: false,
                    signer: false,
                },
                {
                    docs: [],
                    name: 'Token Program',
                    optional: false,
                    signer: false,
                },
            ],
            args: [],
            docs: [],
            name: 'testInstruction',
        };

        const { result } = renderHook(() =>
            useInstructionForm({
                instruction,
                onSubmit: vi.fn(),
            })
        );
        const { form, fieldNames } = result.current;

        const dependency = createKnownAccountsPrefillDependency(instruction, {
            account: fieldNames.account,
        });

        dependency.onValueChange(instruction.name, form);

        expect(form.getValues('accounts.testInstruction.SYSTEM_PROGRAM')).toBe('11111111111111111111111111111111');
        expect(form.getValues('accounts.testInstruction.Token Program')).toBe(
            'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
        );
    });

    it('should not overwrite existing values', () => {
        const instruction: InstructionData = {
            accounts: [
                {
                    docs: [],
                    name: 'systemProgram',
                    optional: false,
                    signer: false,
                },
            ],
            args: [],
            docs: [],
            name: 'testInstruction',
        };

        const { result } = renderHook(() =>
            useInstructionForm({
                instruction,
                onSubmit: vi.fn(),
            })
        );
        const { form, fieldNames } = result.current;

        const existingValue = 'CustomAddress123';
        act(() => {
            form.setValue('accounts.testInstruction.systemProgram', existingValue);
        });

        const dependency = createKnownAccountsPrefillDependency(instruction, {
            account: fieldNames.account,
        });

        dependency.onValueChange(instruction.name, form);

        expect(form.getValues('accounts.testInstruction.systemProgram')).toBe(existingValue);
    });

    it('should fill empty string values', () => {
        const instruction: InstructionData = {
            accounts: [
                {
                    docs: [],
                    name: 'systemProgram',
                    optional: false,
                    signer: false,
                },
            ],
            args: [],
            docs: [],
            name: 'testInstruction',
        };

        const { result } = renderHook(() =>
            useInstructionForm({
                instruction,
                onSubmit: vi.fn(),
            })
        );
        const { form, fieldNames } = result.current;

        act(() => {
            form.setValue('accounts.testInstruction.systemProgram', '   ');
        });

        const dependency = createKnownAccountsPrefillDependency(instruction, {
            account: fieldNames.account,
        });

        dependency.onValueChange(instruction.name, form);

        expect(form.getValues('accounts.testInstruction.systemProgram')).toBe('11111111111111111111111111111111');
    });

    it('should handle nested accounts', () => {
        const instruction: InstructionData = {
            accounts: [
                {
                    accounts: [
                        {
                            docs: [],
                            name: 'systemProgram',
                            optional: false,
                            signer: false,
                        },
                    ],
                    name: 'group',
                },
            ],
            args: [],
            docs: [],
            name: 'testInstruction',
        };

        const { result } = renderHook(() =>
            useInstructionForm({
                instruction,
                onSubmit: vi.fn(),
            })
        );
        const { form, fieldNames } = result.current;

        const dependency = createKnownAccountsPrefillDependency(instruction, {
            account: fieldNames.account,
        });

        dependency.onValueChange(instruction.name, form);

        expect(form.getValues('accounts.testInstruction.group.systemProgram')).toBe('11111111111111111111111111111111');
    });

    it('should return correct dependency id and getValue', () => {
        const instruction: InstructionData = {
            accounts: [],
            args: [],
            docs: [],
            name: 'testInstruction',
        };

        const dependency = createKnownAccountsPrefillDependency(instruction, {
            account: () => 'accounts.testInstruction.test' as any,
        });

        expect(dependency.id).toBe('known-accounts');
        expect(dependency.getValue()).toBe('testInstruction');
    });

    it('should not fill unknown account names', () => {
        const instruction: InstructionData = {
            accounts: [
                {
                    docs: [],
                    name: 'unknownAccount',
                    optional: false,
                    signer: false,
                },
            ],
            args: [],
            docs: [],
            name: 'testInstruction',
        };

        const { result } = renderHook(() =>
            useInstructionForm({
                instruction,
                onSubmit: vi.fn(),
            })
        );
        const { form, fieldNames } = result.current;

        const dependency = createKnownAccountsPrefillDependency(instruction, {
            account: fieldNames.account,
        });

        dependency.onValueChange(instruction.name, form);

        expect(form.getValues('accounts.testInstruction.unknownAccount')).toBe('');
    });
});
