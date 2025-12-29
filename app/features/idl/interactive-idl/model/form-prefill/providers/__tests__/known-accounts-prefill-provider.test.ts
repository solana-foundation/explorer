import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useInstructionForm } from '../../../use-instruction-form';
import { createKnownAccountsPrefillDependency } from '../known-accounts-prefill-provider';
import { createNestedTestAccount, createTestInstruction } from './utils';

describe('createKnownAccountsPrefillDependency', () => {
    it('should fill system program account', () => {
        const instruction = createTestInstruction(['systemProgram']);

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

        expect(form.getValues('accounts.testInstruction.systemProgram')).toBe(SYSTEM_PROGRAM_ADDRESS);
    });

    it('should fill token program account', () => {
        const instruction = createTestInstruction(['tokenProgram']);

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

        expect(form.getValues('accounts.testInstruction.tokenProgram')).toBe(TOKEN_PROGRAM_ADDRESS);
    });

    it('should fill associated token program account', () => {
        const instruction = createTestInstruction(['associatedTokenProgram']);

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
            ASSOCIATED_TOKEN_PROGRAM_ID.toBase58()
        );
    });

    it('should match account names case-insensitively', () => {
        const instruction = createTestInstruction(['SYSTEM_PROGRAM', 'Token Program']);

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

        expect(form.getValues('accounts.testInstruction.SYSTEM_PROGRAM')).toBe(SYSTEM_PROGRAM_ADDRESS);
        expect(form.getValues('accounts.testInstruction.Token Program')).toBe(TOKEN_PROGRAM_ADDRESS);
    });

    it('should not overwrite existing values', () => {
        const instruction = createTestInstruction(['systemProgram']);

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
        const instruction = createTestInstruction(['systemProgram']);

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

        expect(form.getValues('accounts.testInstruction.systemProgram')).toBe(SYSTEM_PROGRAM_ADDRESS);
    });

    it('should handle nested accounts', () => {
        const instruction: Parameters<typeof createKnownAccountsPrefillDependency>[0] = {
            accounts: [createNestedTestAccount('group', ['systemProgram'])],
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

        expect(form.getValues('accounts.testInstruction.group.systemProgram')).toBe(SYSTEM_PROGRAM_ADDRESS);
    });

    it('should return correct dependency id and getValue', () => {
        const instruction = createTestInstruction([]);

        const dependency = createKnownAccountsPrefillDependency(instruction, {
            account: () => 'accounts.testInstruction.test' as any,
        });

        expect(dependency.id).toBe('known-accounts');
        expect(dependency.getValue()).toBe('testInstruction');
    });

    it('should not fill unknown account names', () => {
        const instruction = createTestInstruction(['unknownAccount']);

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
