import type { InstructionData, SupportedIdl } from '@entities/idl';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import votingIdl030 from '../../../__mocks__/anchor/anchor-0.30.0-voting-AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye.json';
import votingIdl030Variations from '../../../__mocks__/anchor/anchor-0.30.0-voting-variations-AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye.json';
import { findInstruction } from '../../../__tests__/utils';
import { useInstructionForm } from '../../../use-instruction-form';
import { createPdaPrefillDependency } from '../pda-prefill-provider';

describe('createPdaPrefillDependency', () => {
    const programId = 'AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye';

    const mockIdl: SupportedIdl = {
        address: programId,
        instructions: [
            {
                accounts: [
                    {
                        name: 'poll',
                        pda: {
                            seeds: [
                                {
                                    kind: 'arg',
                                    path: 'poll_id',
                                },
                            ],
                        },
                        writable: true,
                    },
                ],
                args: [
                    {
                        name: 'poll_id',
                        type: 'u64',
                    },
                ],
                discriminator: [193, 22, 99, 197, 18, 33, 115, 117],
                name: 'initializePoll',
            },
        ],
        metadata: {
            name: 'voting',
            spec: '0.1.0',
            version: '0.1.0',
        },
    };

    it('should return correct dependency id and getValue', () => {
        const instruction: InstructionData = {
            accounts: [],
            args: [],
            docs: [],
            name: 'initializePoll',
        };

        const dependency = createPdaPrefillDependency(mockIdl, instruction, {
            account: () => 'accounts.initializePoll.test' as any,
        });

        expect(dependency.id).toBe('pda-prefill');
        expect(dependency.getValue()).toBe('initializePoll');
        expect(dependency.watchesFormValues).toBe(true);
    });

    it('should not fill when IDL is undefined', () => {
        const instruction: InstructionData = {
            accounts: [
                {
                    docs: [],
                    name: 'poll',
                    optional: false,
                    pda: true,
                    signer: false,
                },
            ],
            args: [],
            docs: [],
            name: 'initializePoll',
        };

        const { result } = renderHook(() =>
            useInstructionForm({
                instruction,
                onSubmit: vi.fn(),
            })
        );
        const { form, fieldNames } = result.current;

        const dependency = createPdaPrefillDependency(undefined, instruction, {
            account: fieldNames.account,
        });

        const setValueSpy = vi.spyOn(form, 'setValue');
        dependency.onValueChange(instruction.name, form);

        expect(setValueSpy).not.toHaveBeenCalled();
    });

    it('should fill PDA account when form values are provided', () => {
        const instruction = findInstruction(votingIdl030, 'initialize_poll')!;

        const { result } = renderHook(() =>
            useInstructionForm({
                instruction,
                onSubmit: vi.fn(),
            })
        );
        const { form, fieldNames } = result.current;

        act(() => {
            form.setValue('arguments.initializePoll.pollId', '123');
        });

        const dependency = createPdaPrefillDependency(mockIdl, instruction, {
            account: fieldNames.account,
        });

        dependency.onValueChange(instruction.name, form);

        const pollValue = form.getValues('accounts.initializePoll.poll');
        expect(pollValue).toBeDefined();
        expect(typeof pollValue).toBe('string');
        expect(pollValue).not.toBe('');
    });

    it('should not overwrite existing PDA value if it matches', () => {
        const instruction = findInstruction(votingIdl030, 'initialize_poll')!;

        const { result } = renderHook(() =>
            useInstructionForm({
                instruction,
                onSubmit: vi.fn(),
            })
        );
        const { form, fieldNames } = result.current;

        act(() => {
            form.setValue('arguments.initializePoll.pollId', '123');
        });

        const dependency = createPdaPrefillDependency(mockIdl, instruction, {
            account: fieldNames.account,
        });

        // First call to fill the PDA
        dependency.onValueChange(instruction.name, form);
        const firstValue = form.getValues('accounts.initializePoll.poll');

        // Second call should not change the value
        const setValueSpy = vi.spyOn(form, 'setValue');
        dependency.onValueChange(instruction.name, form);

        expect(form.getValues('accounts.initializePoll.poll')).toBe(firstValue);
        // setValue should not be called if the value hasn't changed
        expect(setValueSpy).not.toHaveBeenCalled();
    });

    it('should handle nested PDA accounts', () => {
        const instruction = findInstruction(votingIdl030Variations, 'instruction_with_nested')!;

        const { result } = renderHook(() =>
            useInstructionForm({
                instruction,
                onSubmit: vi.fn(),
            })
        );
        const { form, fieldNames } = result.current;

        act(() => {
            form.setValue('arguments.instructionWithNested.pollId', '123');
        });

        const dependency = createPdaPrefillDependency(votingIdl030Variations as unknown as SupportedIdl, instruction, {
            account: fieldNames.account,
        });

        dependency.onValueChange(instruction.name, form);

        const nestedAccountValue = form.getValues('accounts.instructionWithNested.nestedGroup.nestedAccount');
        expect(nestedAccountValue).toBeDefined();
        expect(typeof nestedAccountValue).toBe('string');
    });

    it('should not fill non-PDA accounts', () => {
        const instruction = findInstruction(votingIdl030Variations, 'instruction_with_non_pda')!;

        const { result } = renderHook(() =>
            useInstructionForm({
                instruction,
                onSubmit: vi.fn(),
            })
        );
        const { form, fieldNames } = result.current;

        const dependency = createPdaPrefillDependency(votingIdl030Variations as unknown as SupportedIdl, instruction, {
            account: fieldNames.account,
        });

        const setValueSpy = vi.spyOn(form, 'setValue');
        dependency.onValueChange(instruction.name, form);

        expect(setValueSpy).not.toHaveBeenCalled();
    });
});
