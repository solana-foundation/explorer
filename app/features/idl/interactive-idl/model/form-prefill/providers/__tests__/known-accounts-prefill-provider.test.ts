// @vitest-environment jsdom

import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { ASSOCIATED_TOKEN_PROGRAM_ADDRESS, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createKnownAccountsPrefillDependency } from '../known-accounts-prefill-provider';
import { createNestedTestAccount, createTestInstruction, renderInstructionForm } from './utils';

describe('createKnownAccountsPrefillDependency', () => {
    it.each([
        ['systemProgram', SYSTEM_PROGRAM_ADDRESS],
        ['tokenProgram', TOKEN_PROGRAM_ADDRESS],
        ['associatedTokenProgram', ASSOCIATED_TOKEN_PROGRAM_ADDRESS],
    ])('should fill %s account', (accountName, expectedAddress) => {
        const instruction = createTestInstruction([accountName]);
        const { form, fieldNames } = renderInstructionForm(instruction);

        const dependency = createKnownAccountsPrefillDependency(instruction, {
            account: fieldNames.account,
        });

        dependency.onValueChange(instruction.name, form);

        expect(form.getValues(`accounts.testInstruction.${accountName}`)).toBe(expectedAddress);
    });

    it('should match account names case-insensitively', () => {
        const instruction = createTestInstruction(['SYSTEM_PROGRAM', 'Token Program']);
        const { form, fieldNames } = renderInstructionForm(instruction);

        const dependency = createKnownAccountsPrefillDependency(instruction, {
            account: fieldNames.account,
        });

        dependency.onValueChange(instruction.name, form);

        expect(form.getValues('accounts.testInstruction.SYSTEM_PROGRAM')).toBe(SYSTEM_PROGRAM_ADDRESS);
        expect(form.getValues('accounts.testInstruction.Token Program')).toBe(TOKEN_PROGRAM_ADDRESS);
    });

    it('should not overwrite existing values', () => {
        const instruction = createTestInstruction(['systemProgram']);
        const { form, fieldNames } = renderInstructionForm(instruction);

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
        const { form, fieldNames } = renderInstructionForm(instruction);

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
        const instruction = createTestInstruction([createNestedTestAccount('group', ['systemProgram'])]);
        const { form, fieldNames } = renderInstructionForm(instruction);

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
        const { form, fieldNames } = renderInstructionForm(instruction);

        const dependency = createKnownAccountsPrefillDependency(instruction, {
            account: fieldNames.account,
        });

        dependency.onValueChange(instruction.name, form);

        expect(form.getValues('accounts.testInstruction.unknownAccount')).toBe('');
    });
});
