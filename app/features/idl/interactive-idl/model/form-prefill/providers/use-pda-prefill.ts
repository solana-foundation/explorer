import type { InstructionData } from '@entities/idl';
import { camelCase } from 'change-case';
import { useEffect, useMemo, useRef } from 'react';
import type { FieldPath, UseFormReturn } from 'react-hook-form';

import type { PdaGenerationResult } from '../../pda-generator/types';
import type { FormValue, InstructionFormData, InstructionFormFieldNames } from '../../use-instruction-form';
import { traverseInstructionAccounts } from './traverse-accounts';

/**
 * Hook that applies pre-computed PDA values to form fields.
 *
 * Behavior:
 * - Fills empty fields
 * - Fills fields that haven't been tracked before (first time)
 * - Updates fields that were previously auto-filled when the generated PDA value changes
 * - Preserves manual edits (fields with values that don't match the last auto-filled value)
 */
export function usePdaPrefill({
    pdas,
    form,
    instruction,
    fieldNames,
}: {
    pdas: Record<string, PdaGenerationResult>;
    form: UseFormReturn<InstructionFormData>;
    instruction: InstructionData;
    fieldNames: Pick<InstructionFormFieldNames, 'account'>;
}) {
    const lastGeneratedValues = useRef<Map<string, string>>(new Map());

    const pdaAccountPaths = useMemo(() => {
        const paths = new Map<string, FieldPath<InstructionFormData>>();

        traverseInstructionAccounts(instruction, (account, parentGroup) => {
            if (account.pda) {
                const camelName = camelCase(account.name);
                if (parentGroup) {
                    paths.set(camelName, fieldNames.account(parentGroup, account));
                } else {
                    paths.set(camelName, fieldNames.account(account));
                }
            }
        });

        return paths;
    }, [instruction, fieldNames]);

    useEffect(() => {
        for (const [accountName, path] of pdaAccountPaths.entries()) {
            const pdaData = pdas[accountName];
            if (!pdaData?.generated) continue;

            const currentValue = String(form.getValues(path) || '').trim();
            const generatedValue = pdaData.generated;

            const stateKey = `${instruction.name}:${path}`;
            const lastGenerated = lastGeneratedValues.current.get(stateKey);

            const isEmpty = !currentValue;
            const neverTracked = lastGenerated === undefined;
            const wasAutoFilled = lastGenerated !== undefined && currentValue === lastGenerated;
            const generatedChanged = lastGenerated !== undefined && lastGenerated !== generatedValue;

            const shouldAutoFill = isEmpty || wasAutoFilled || neverTracked;

            if (shouldAutoFill && currentValue !== generatedValue) {
                form.setValue(path, generatedValue as unknown as FormValue, {
                    shouldDirty: false,
                    shouldValidate: false,
                });
            }

            if (neverTracked || generatedChanged) {
                lastGeneratedValues.current.set(stateKey, generatedValue);
            }
        }
    }, [pdas, form, instruction.name, pdaAccountPaths]);
}
