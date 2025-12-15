import type { ArgField } from '@entities/idl';
import { Badge } from '@shared/ui/badge';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { forwardRef, useEffect, useId, useRef } from 'react';
import { X } from 'react-feather';

import { getArrayMaxLength, isArrayArg, isRequiredArg, isVectorArg } from '../lib/instruction-args';

const MAX_ARRAY_INPUTS = 100;

export interface ArgumentInputProps extends React.ComponentProps<'input'> {
    arg: ArgField;
    error?: { message?: string | undefined } | undefined;
}
export const ArgumentInput = forwardRef<HTMLInputElement, ArgumentInputProps>(({ arg, error, ...props }, ref) => {
    const inputId = useId();
    const isArrayOrVec = isArrayArg(arg) || isVectorArg(arg);

    if (isArrayOrVec) {
        return <ArrayArgumentInput ref={ref} arg={arg} error={error} inputId={inputId} {...props} />;
    }

    return <SingleArgumentInput ref={ref} arg={arg} error={error} inputId={inputId} {...props} />;
});
ArgumentInput.displayName = 'ArgumentInput';

interface ArrayArgumentInputProps extends Omit<ArgumentInputProps, 'ref'> {
    inputId: string;
}
const ArrayArgumentInput = forwardRef<HTMLInputElement, ArrayArgumentInputProps>(
    ({ arg, error, value, onChange, onBlur, inputId, ...props }, ref) => {
        const idCounterRef = useRef(0);
        const stableIdsRef = useRef<string[]>([]);
        const inputRefsRef = useRef<Map<string, HTMLInputElement>>(new Map());

        const parseValues = (val: string | number | readonly string[] | undefined): string[] => {
            if (!val || typeof val !== 'string') return [''];
            const trimmed = val.trim();
            if (trimmed === '') return [''];
            return trimmed.split(',').map(v => v.trim());
        };

        const values = parseValues(value);
        const previousLengthRef = useRef(values.length);
        const removedIndexRef = useRef<number | null>(null);

        // Add new IDs when array grows (removals are handled in handleRemoveItem)
        if (stableIdsRef.current.length < values.length) {
            const newIds = Array.from(
                { length: values.length - stableIdsRef.current.length },
                () => `item-${idCounterRef.current++}`
            );
            stableIdsRef.current = [...stableIdsRef.current, ...newIds];
        }

        useEffect(() => {
            const lengthDiff = values.length - previousLengthRef.current;
            if (lengthDiff > 0) {
                const lastItemId = stableIdsRef.current[stableIdsRef.current.length - 1];
                inputRefsRef.current.get(lastItemId)?.focus();
            } else if (lengthDiff < 0 && removedIndexRef.current !== null) {
                // Focus the input at the removed index (or previous if it was last)
                const focusIndex = Math.min(removedIndexRef.current, values.length - 1);
                if (focusIndex >= 0) {
                    inputRefsRef.current.get(stableIdsRef.current[focusIndex])?.focus();
                }
                removedIndexRef.current = null;
            }
            previousLengthRef.current = values.length;
        }, [values.length]);

        const updateValue = (newValues: string[]) => {
            if (!onChange) return;
            onChange({
                target: { value: newValues.join(', ') },
            } as React.ChangeEvent<HTMLInputElement>);
        };

        const handleItemChange = (index: number, newValue: string) => {
            const sanitizedValue = newValue.replace(/,/g, '');

            const newValues = [...values];
            newValues[index] = sanitizedValue;
            updateValue(newValues);
        };

        const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
            e.preventDefault();
            const pastedValues = e.clipboardData
                .getData('text')
                .split(',')
                .map(v => v.trim())
                .filter(v => v !== '');

            if (pastedValues.length === 0) return;

            const newValues = [...values];
            newValues[index] = pastedValues[0];

            if (pastedValues.length > 1) {
                const remainingValues = pastedValues.slice(1);
                const maxLength = getArrayMaxLength(arg) ?? MAX_ARRAY_INPUTS;
                const availableSlots = maxLength - newValues.length;
                const valuesToAdd = remainingValues.slice(0, availableSlots);

                if (valuesToAdd.length > 0) {
                    newValues.push(...valuesToAdd);
                    const newIds = Array.from({ length: valuesToAdd.length }, () => `item-${idCounterRef.current++}`);
                    stableIdsRef.current = [...stableIdsRef.current, ...newIds];
                }
            }

            updateValue(newValues);
        };

        const lastItemIsEmpty = values.length > 0 && values[values.length - 1] === '';
        const maxLength = getArrayMaxLength(arg) ?? MAX_ARRAY_INPUTS;
        const isAtMaxLength = values.length >= maxLength;

        const handleAddItem = () => {
            if (lastItemIsEmpty || isAtMaxLength) return;
            updateValue([...values, '']);
        };

        const handleRemoveItem = (index: number) => {
            if (values.length <= 1) return;

            removedIndexRef.current = index;
            const newIds = [...stableIdsRef.current];
            newIds.splice(index, 1);
            stableIdsRef.current = newIds;
            updateValue(values.filter((_, i) => i !== index));
        };

        const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && index === values.length - 1 && !lastItemIsEmpty && !isAtMaxLength) {
                e.preventDefault();
                handleAddItem();
            }
            // Allow Delete/Backspace to remove item when input is empty and not the last item
            if ((e.key === 'Delete' || e.key === 'Backspace') && values[index] === '' && values.length > 1) {
                e.preventDefault();
                handleRemoveItem(index);
            }
        };

        return (
            <ArgumentInputLayout
                arg={arg}
                error={error}
                inputId={inputId}
                actions={
                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="e-m-0 e-w-fit e-border-none e-bg-transparent e-p-0 e-text-xs e-text-accent-700 disabled:e-text-neutral-400"
                        disabled={lastItemIsEmpty || isAtMaxLength}
                    >
                        Add
                    </button>
                }
            >
                <div className="e-space-y-2">
                    {values.map((item, index) => (
                        <div key={stableIdsRef.current[index]} className="e-flex e-items-center e-gap-2">
                            <Input
                                ref={inputElement => {
                                    const itemId = stableIdsRef.current[index];
                                    if (inputElement) {
                                        inputRefsRef.current.set(itemId, inputElement);
                                    } else {
                                        inputRefsRef.current.delete(itemId);
                                    }
                                    if (index === 0) {
                                        if (typeof ref === 'function') {
                                            ref(inputElement);
                                        } else if (ref) {
                                            (ref as React.MutableRefObject<HTMLInputElement | null>).current =
                                                inputElement;
                                        }
                                    }
                                }}
                                id={index === 0 ? inputId : undefined}
                                variant="dark"
                                value={item}
                                onChange={e => handleItemChange(index, e.target.value)}
                                onPaste={e => handlePaste(index, e)}
                                onKeyDown={e => handleKeyDown(index, e)}
                                onBlur={onBlur}
                                aria-invalid={Boolean(error)}
                                {...props}
                            />
                            {values.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="e-m-0 e-flex e-h-6 e-w-6 e-cursor-pointer e-items-center e-justify-center e-border-none e-bg-transparent e-p-0 e-text-xs e-text-neutral-400 hover:e-text-destructive"
                                    aria-label="Remove item"
                                    tabIndex={-1}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </ArgumentInputLayout>
        );
    }
);
ArrayArgumentInput.displayName = 'ArrayArgumentInput';

interface SingleArgumentInputProps extends ArgumentInputProps {
    inputId: string;
}
const SingleArgumentInput = forwardRef<HTMLInputElement, SingleArgumentInputProps>(
    ({ arg, error, value, onChange, onBlur, inputId, ...props }, ref) => {
        return (
            <ArgumentInputLayout arg={arg} error={error} inputId={inputId}>
                <Input
                    ref={ref}
                    id={inputId}
                    variant="dark"
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    {...props}
                    aria-invalid={Boolean(error)}
                />
            </ArgumentInputLayout>
        );
    }
);
SingleArgumentInput.displayName = 'SingleArgumentInput';

function ArgumentInputLayout({
    arg,
    error,
    inputId,
    children,
    actions,
}: {
    arg: ArgField;
    error: { message?: string | undefined } | undefined;
    inputId: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
}) {
    return (
        <div className="e-space-y-2">
            <div className="e-flex e-items-center e-gap-2">
                <Label className="e-text-sm e-font-normal e-text-neutral-200" htmlFor={inputId}>
                    {arg.name}
                </Label>
                <Badge variant="info" size="xs">
                    {arg.type}
                </Badge>
                {!isRequiredArg(arg) && (
                    <Badge variant="secondary" size="xs">
                        Optional
                    </Badge>
                )}
                {actions && <div className="e-ml-auto e-flex e-gap-2">{actions}</div>}
            </div>
            {children}
            {arg.docs.length > 0 && <p className="e-text-xs e-text-neutral-400">{arg.docs.join(' ')}</p>}
            {error && <p className="e-mt-1 e-text-xs e-text-destructive">{error.message}</p>}
        </div>
    );
}
