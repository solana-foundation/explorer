import type { InstructionData } from '@entities/idl';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useInstructionForm } from '../use-instruction-form';
import type { ExternalDependency } from './types';
import { useFormPrefill } from './use-form-prefill';

describe('useFormPrefill', () => {
    it('should not trigger any callbacks when there are no dependencies', () => {
        const { form } = setup();
        const { result } = renderHook(() =>
            useFormPrefill({
                config: {
                    externalDependencies: [],
                },
                form,
            })
        );

        expect(result.current).toBeUndefined();
    });

    it('should not trigger any callbacks when dependencies are undefined', () => {
        const { form } = setup();
        const { result } = renderHook(() =>
            useFormPrefill({
                config: {},
                form,
            })
        );

        expect(result.current).toBeUndefined();
    });

    it('should trigger onValueChange when dependency value changes', async () => {
        const { form } = setup();
        const onValueChange = vi.fn();
        const dependency: ExternalDependency<string> = {
            getValue: () => 'initial-value',
            id: 'test-dependency',
            onValueChange,
        };

        const { rerender } = renderHook(
            ({ value }) => {
                dependency.getValue = () => value;
                return useFormPrefill({
                    config: {
                        externalDependencies: [dependency],
                    },
                    form,
                });
            },
            {
                initialProps: { value: 'initial-value' },
            }
        );

        expect(onValueChange).toHaveBeenCalledTimes(1);

        rerender({ value: 'new-value' });

        expect(onValueChange).toHaveBeenCalledTimes(2);
    });

    it('should not trigger onValueChange when dependency value has not changed', async () => {
        const { form } = setup();
        const onValueChange = vi.fn();
        const dependency: ExternalDependency<string> = {
            getValue: () => 'same-value',
            id: 'test-dependency',
            onValueChange,
        };

        const { rerender } = renderHook(
            () => {
                return useFormPrefill({
                    config: {
                        externalDependencies: [dependency],
                    },
                    form,
                });
            },
            {
                initialProps: {},
            }
        );

        expect(onValueChange).toHaveBeenCalledTimes(1);

        rerender();

        expect(onValueChange).toHaveBeenCalledTimes(1);
    });

    it('should trigger onValueChange for dependencies with watchesFormValues when form values change', async () => {
        const { form } = setup();
        const onValueChange = vi.fn();
        const dependency: ExternalDependency<string> = {
            getValue: () => 'constant-value',
            id: 'pda-prefill',
            onValueChange,
            watchesFormValues: true,
        };

        renderHook(() =>
            useFormPrefill({
                config: {
                    externalDependencies: [dependency],
                },
                form,
            })
        );

        expect(onValueChange).toHaveBeenCalled();

        const initialCallCount = onValueChange.mock.calls.length;

        act(() => {
            form.setValue('arguments.testInstruction.testArg', 'new-value');
        });

        expect(onValueChange.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should handle multiple dependencies independently', async () => {
        const { form } = setup();
        const onValueChange1 = vi.fn();
        const onValueChange2 = vi.fn();

        const dependency1: ExternalDependency<string> = {
            getValue: () => 'value-1',
            id: 'dependency-1',
            onValueChange: onValueChange1,
        };

        const dependency2: ExternalDependency<string> = {
            getValue: () => 'value-2',
            id: 'dependency-2',
            onValueChange: onValueChange2,
        };

        const { rerender } = renderHook(
            ({ value1, value2 }) => {
                dependency1.getValue = () => value1;
                dependency2.getValue = () => value2;
                return useFormPrefill({
                    config: {
                        externalDependencies: [dependency1, dependency2],
                    },
                    form,
                });
            },
            {
                initialProps: { value1: 'value-1', value2: 'value-2' },
            }
        );

        expect(onValueChange1).toHaveBeenCalledTimes(1);
        expect(onValueChange2).toHaveBeenCalledTimes(1);

        rerender({ value1: 'new-value-1', value2: 'value-2' });

        expect(onValueChange1).toHaveBeenCalledTimes(2);
        expect(onValueChange2).toHaveBeenCalledTimes(1);
    });

    it('should pass current value and form to onValueChange', async () => {
        const { form } = setup();
        const onValueChange = vi.fn();
        const dependency: ExternalDependency<string> = {
            getValue: () => 'test-value',
            id: 'test-dependency',
            onValueChange,
        };

        renderHook(() =>
            useFormPrefill({
                config: {
                    externalDependencies: [dependency],
                },
                form,
            })
        );

        expect(onValueChange).toHaveBeenCalledWith('test-value', form);
    });
});

function setup() {
    const instruction = createMockInstruction();
    const { result } = renderHook(() =>
        useInstructionForm({
            instruction,
            onSubmit: vi.fn(),
        })
    );
    return { form: result.current.form };
}

function createMockInstruction(): InstructionData {
    return {
        accounts: [
            {
                docs: [],
                name: 'testAccount',
                optional: false,
                signer: false,
            },
        ],
        args: [
            {
                docs: [],
                name: 'testArg',
                type: 'string',
            },
        ],
        docs: [],
        name: 'testInstruction',
    };
}
