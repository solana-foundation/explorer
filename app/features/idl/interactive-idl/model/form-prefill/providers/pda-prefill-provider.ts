import type { InstructionData, SupportedIdl } from '@entities/idl';
import { camelCase } from 'change-case';
import type { FieldPath, UseFormReturn } from 'react-hook-form';

import { computePdas } from '../../pda-generator/compute-pdas';
import type { FormValue, InstructionFormData, InstructionFormFieldNames } from '../../use-instruction-form';
import type { ExternalDependency } from '../types';
import { traverseInstructionAccounts } from './traverse-accounts';

const formStateCache = new WeakMap<UseFormReturn<InstructionFormData>, Map<string, string>>();

/**
 * Creates a PDA prefill dependency that automatically fills PDA accounts
 * with generated addresses when form values change.
 *
 * This provider watches form arguments and accounts, regenerates PDAs when
 * relevant values change, and fills PDA account fields automatically.
 * 
 * Behavior:
 * - Fills empty fields
 * - Fills fields that haven't been tracked before (first time)
 * - Updates fields that were previously auto-filled when the generated PDA value changes (new generated value)
 * - Preserves manual edits (fields with values that don't match the last auto-filled value)
 */
export function createPdaPrefillDependency(
    idl: SupportedIdl | undefined,
    instruction: InstructionData,
    fieldNames: Pick<InstructionFormFieldNames, 'account'>
): ExternalDependency<string> {
    const pdaAccountPaths = new Map<string, FieldPath<InstructionFormData>>();

    traverseInstructionAccounts(instruction, (account, parentGroup) => {
        if (account.pda) {
            const camelName = camelCase(account.name);
            if (parentGroup) {
                pdaAccountPaths.set(camelName, fieldNames.account(parentGroup, account));
            } else {
                pdaAccountPaths.set(camelName, fieldNames.account(account));
            }
        }
    });

    return {
        getValue: () => instruction.name,
        id: 'pda-prefill',
        onValueChange: (_value: unknown, form: UseFormReturn<InstructionFormData>) => {
            if (!idl) {
                return;
            }

            let lastGeneratedValues = formStateCache.get(form);
            if (!lastGeneratedValues) {
                lastGeneratedValues = new Map<string, string>();
                formStateCache.set(form, lastGeneratedValues);
            }

            const formValues = form.getValues();
            const pdas = computePdas(idl, instruction, formValues);

            for (const [accountName, path] of pdaAccountPaths.entries()) {
                const pdaData = pdas[accountName];
                if (!pdaData?.generated) continue;

                const currentValue = String(form.getValues(path) || '').trim();
                const generatedValue = pdaData.generated;

                const stateKey = `${instruction.name}:${path}`;
                const lastGenerated = lastGeneratedValues.get(stateKey);

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
                    lastGeneratedValues.set(stateKey, generatedValue);
                }
            }
        },
        watchesFormValues: true,
    };
}
