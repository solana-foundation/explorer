import type { SupportedIdl } from '@entities/idl';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import votingIdl030 from '../../../__mocks__/anchor/anchor-0.30.0-voting-AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye.json';
import votingIdl030Variations from '../../../__mocks__/anchor/anchor-0.30.0-voting-variations-AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye.json';
import { findInstruction } from '../../../__tests__/utils';
import { useInstructionForm } from '../../../use-instruction-form';
import { createPdaPrefillDependency } from '../pda-prefill-provider';

describe('createPdaPrefillDependency', () => {
    it('should return correct dependency id and getValue', () => {
        const { mockIdl, mockInstruction } = setup(votingIdl030, 'initialize_poll');

        const dependency = createPdaPrefillDependency(mockIdl, mockInstruction, {
            account: () => 'accounts.initializePoll.test' as any,
        });

        expect(dependency.id).toBe('pda-prefill');
        expect(dependency.getValue()).toBe('initializePoll');
        expect(dependency.watchesFormValues).toBe(true);
    });

    it('should not fill when IDL is undefined', () => {
        const { createForm, mockInstruction } = setup(votingIdl030, 'initialize_poll');
        const { form, fieldNames } = createForm();

        const dependency = createPdaPrefillDependency(undefined, mockInstruction, {
            account: fieldNames.account,
        });

        const setValueSpy = vi.spyOn(form, 'setValue');
        dependency.onValueChange(mockInstruction.name, form);

        expect(setValueSpy).not.toHaveBeenCalled();
    });

    it('should fill PDA account when form values are provided', () => {
        const { createForm, mockIdl, mockInstruction } = setup(votingIdl030, 'initialize_poll');
        const { form, fieldNames } = createForm();

            form.setValue('arguments.initializePoll.pollId', '123');

        const dependency = createPdaPrefillDependency(mockIdl, mockInstruction, {
            account: fieldNames.account,
        });

        dependency.onValueChange(mockInstruction.name, form);

        const pollValue = form.getValues('accounts.initializePoll.poll');
        expect(pollValue).toBeDefined();
        expect(typeof pollValue).toBe('string');
        expect(pollValue).not.toBe('');
    });

    it('should not overwrite existing PDA value if it matches', () => {
        const { createForm, mockIdl, mockInstruction } = setup(votingIdl030, 'initialize_poll');
        const { form, fieldNames } = createForm();

            form.setValue('arguments.initializePoll.pollId', '123');

        const dependency = createPdaPrefillDependency(mockIdl, mockInstruction, {
            account: fieldNames.account,
        });

        dependency.onValueChange(mockInstruction.name, form);
        const firstValue = form.getValues('accounts.initializePoll.poll');

        dependency.onValueChange(mockInstruction.name, form);

        expect(form.getValues('accounts.initializePoll.poll')).toBe(firstValue);
    });

    it('should handle nested PDA accounts', () => {
        const { createForm, mockIdl, mockInstruction } = setup(votingIdl030Variations, 'instruction_with_nested');
        const { form, fieldNames } = createForm();

            form.setValue('arguments.instructionWithNested.pollId', '123');

        const dependency = createPdaPrefillDependency(mockIdl, mockInstruction, {
            account: fieldNames.account,
        });

        dependency.onValueChange(mockInstruction.name, form);

        const nestedAccountValue = form.getValues('accounts.instructionWithNested.nestedGroup.nestedAccount');
        expect(nestedAccountValue).toBeDefined();
        expect(typeof nestedAccountValue).toBe('string');
    });

    it('should not fill non-PDA accounts', () => {
        const { createForm, mockIdl, mockInstruction } = setup(votingIdl030Variations, 'instruction_with_non_pda');
        const { form, fieldNames } = createForm();

        const dependency = createPdaPrefillDependency(mockIdl, mockInstruction, {
            account: fieldNames.account,
        });

        const setValueSpy = vi.spyOn(form, 'setValue');
        dependency.onValueChange(mockInstruction.name, form);

        expect(setValueSpy).not.toHaveBeenCalled();
    });

    it('should preserve manual edits', () => {
        const { createForm, mockIdl, mockInstruction } = setup(votingIdl030, 'initialize_poll');
        const { form, fieldNames } = createForm();

            form.setValue('arguments.initializePoll.pollId', '123');

        const dependency = createPdaPrefillDependency(mockIdl, mockInstruction, {
            account: fieldNames.account,
        });

        dependency.onValueChange(mockInstruction.name, form);

        const manualEdit = 'ManuallyEditedAddress123456789';
            form.setValue('accounts.initializePoll.poll', manualEdit);

        dependency.onValueChange(mockInstruction.name, form);

        expect(form.getValues('accounts.initializePoll.poll')).toBe(manualEdit);
    });

    it('should update auto-filled fields when generated value changes', () => {
        const { createForm, mockIdl, mockInstruction } = setup(votingIdl030, 'initialize_poll');
        const { form, fieldNames } = createForm();

            form.setValue('arguments.initializePoll.pollId', '123');

        const dependency = createPdaPrefillDependency(mockIdl, mockInstruction, {
            account: fieldNames.account,
        });

        dependency.onValueChange(mockInstruction.name, form);
        const firstValue = form.getValues('accounts.initializePoll.poll');

            form.setValue('arguments.initializePoll.pollId', '456');

        dependency.onValueChange(mockInstruction.name, form);
        const secondValue = form.getValues('accounts.initializePoll.poll');

        expect(secondValue).not.toBe(firstValue);
        expect(secondValue).not.toBe('');
    });
});

function setup(idl: unknown, instructionName: string) {
    const mockIdl = idl as SupportedIdl;
    const mockInstruction = findInstruction(idl, instructionName)!;

    const createForm = () => {
        return renderHook(() =>
            useInstructionForm({
                instruction: mockInstruction,
                onSubmit: vi.fn(),
            })
        ).result.current;
    };

    return { createForm, mockIdl, mockInstruction };
}
