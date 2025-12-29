import type { ArgField } from '@entities/idl';
import { Badge } from '@shared/ui/badge';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { forwardRef, useEffect, useId, useRef } from 'react';
import { X } from 'react-feather';

import { getArrayLengthFromIdlType, isArrayArg, isRequiredArg, isVectorArg } from '../lib/instruction-args';

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
        const { values, maxLength, isAtMaxLength, isAtMinLength, lastItemIsEmpty } = useArrayValueState(value, arg);
        const { stableIds, removeId } = useStableIds(values.length);
        const { setRef, getRef, removeRefsForIds } = useInputRefs();
        const { setRemovedIndex } = useAutoFocus(values, stableIds, getRef);

        const updateValue = (newValues: string[]) => {
            if (!onChange) return;
            onChange({
                target: { value: newValues.join(', ') },
            } as React.ChangeEvent<HTMLInputElement>);
        };

        const handleItemChange = (index: number, newValue: string) => {
            const sanitizeArrayItem = (value: string) => value.replace(/,/g, '');
            const sanitizedValue = sanitizeArrayItem(newValue);
            const newValues = [...values];
            newValues[index] = sanitizedValue;
            updateValue(newValues);
        };

        const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
            e.preventDefault();

            const pastedText = e.clipboardData.getData('text');
            const pastedValues = parseCommaSeparatedValues(pastedText).filter(v => v !== '');

            if (pastedValues.length === 0) return;

            const newValues = [...values];
            newValues[index] = pastedValues[0];

            const remainingValues = pastedValues.slice(1);
            const availableSlots = Math.max(0, maxLength - newValues.length);
            const valuesToAdd = remainingValues.slice(0, availableSlots);

            if (valuesToAdd.length > 0) {
                newValues.push(...valuesToAdd);
                // IDs will be generated automatically by useStableIds when values.length changes
            }
            if (!newValues) return;
            updateValue(newValues);
        };

        const handleAddItem = () => {
            if (lastItemIsEmpty || isAtMaxLength) return;
            updateValue([...values, '']);
        };

        const handleRemoveItem = (index: number) => {
            if (values.length <= 1) return;

            setRemovedIndex(index);
            const itemId = stableIds[index];
            removeRefsForIds([itemId]);
            removeId(index);
            updateValue(values.filter((_, i) => i !== index));
        };

        const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && index === values.length - 1 && !lastItemIsEmpty && !isAtMaxLength) {
                e.preventDefault();
                handleAddItem();
            }
            if ((e.key === 'Delete' || e.key === 'Backspace') && values[index] === '') {
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
                    {values.map((item, index) => {
                        const itemId = stableIds[index];
                        return (
                            <div key={itemId} className="e-flex e-items-center e-gap-2">
                                <Input
                                    ref={inputElement => {
                                        setRef(itemId, inputElement);
                                        if (index !== 0) return;
                                        if (typeof ref === 'function') {
                                            ref(inputElement);
                                        } else if (ref) {
                                            ref.current = inputElement;
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
                                {!isAtMinLength && (
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
                        );
                    })}
                </div>
            </ArgumentInputLayout>
        );
    }
);
ArrayArgumentInput.displayName = 'ArrayArgumentInput';

/**
 * Manages stable IDs for array items to prevent React key issues when items are removed.
 * Generates new IDs when the array grows, and provides a method to remove IDs when items are deleted.
 */
function useStableIds(arrayLength: number) {
    const idCounterRef = useRef(0);
    const stableIdsRef = useRef<string[]>([]);

    // Add new IDs when array grows
    if (stableIdsRef.current.length < arrayLength) {
        const newIds = Array.from(
            { length: arrayLength - stableIdsRef.current.length },
            () => `item-${idCounterRef.current++}`
        );
        stableIdsRef.current = [...stableIdsRef.current, ...newIds];
    }

    const removeId = (index: number) => {
        const newIds = [...stableIdsRef.current];
        newIds.splice(index, 1);
        stableIdsRef.current = newIds;
    };

    return { removeId, stableIds: stableIdsRef.current };
}

/**
 * Manages a map of input element refs keyed by stable item IDs.
 * Provides methods to set and get refs, and to remove refs when items are deleted.
 */
function useInputRefs() {
    const inputRefsRef = useRef<Map<string, HTMLInputElement>>(new Map());

    const setRef = (itemId: string, element: HTMLInputElement | null) => {
        if (element) {
            inputRefsRef.current.set(itemId, element);
        } else {
            inputRefsRef.current.delete(itemId);
        }
    };

    const getRef = (itemId: string): HTMLInputElement | undefined => inputRefsRef.current.get(itemId);

    const removeRefsForIds = (idsToRemove: string[]) => {
        idsToRemove.forEach(id => inputRefsRef.current.delete(id));
    };

    return { getRef, removeRefsForIds, setRef };
}

/**
 * Manages auto-focus behavior when array items are added or removed.
 */
function useAutoFocus(
    values: string[],
    stableIds: string[],
    getInputRef: (itemId: string) => HTMLInputElement | undefined
) {
    const previousLengthRef = useRef(values.length);
    const removedIndexRef = useRef<number | null>(null);

    useEffect(() => {
        const lengthDiff = values.length - previousLengthRef.current;

        if (lengthDiff > 0) {
            // Item was added - focus the last item
            const lastItemId = stableIds[stableIds.length - 1];
            getInputRef(lastItemId)?.focus();
            previousLengthRef.current = values.length;
            return;
        }

        if (lengthDiff < 0 && removedIndexRef.current !== null) {
            // Item was removed - focus the item at the removed index (or previous if it was last)
            const focusIndex = Math.max(0, Math.min(removedIndexRef.current, values.length - 1));
            getInputRef(stableIds[focusIndex])?.focus();
            removedIndexRef.current = null;
        }

        previousLengthRef.current = values.length;
    }, [values.length, stableIds, getInputRef]);

    const setRemovedIndex = (index: number) => {
        removedIndexRef.current = index;
    };

    return { setRemovedIndex };
}

/**
 * Manages array value derived state and provides helpers for UI logic.
 */
function useArrayValueState(
    value: string | number | readonly string[] | undefined,
    arg: ArgField,
    maxArrayInputs = 100
) {
    const parseStateValue = (value: string | number | readonly string[] | undefined): string[] => {
        if (!value || typeof value !== 'string') return [''];
        const trimmed = value.trim();
        if (trimmed === '') return [''];
        return parseCommaSeparatedValues(trimmed);
    };

    const values = parseStateValue(value);
    const maxLength = (arg.rawType && getArrayLengthFromIdlType(arg.rawType)) ?? maxArrayInputs;
    const isAtMinLength = values.length <= 1;
    const isAtMaxLength = values.length >= maxLength;
    const lastItemIsEmpty = values.length > 0 && values[values.length - 1] === '';

    return {
        isAtMaxLength,
        isAtMinLength,
        lastItemIsEmpty,
        maxLength,
        values,
    };
}

function parseCommaSeparatedValues(value: string): string[] {
    return value.split(',').map(v => v.trim());
}

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
