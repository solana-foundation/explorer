import type { InstructionData, SupportedIdl } from '@entities/idl';
import { camelCase } from 'change-case';
import type { FieldPath, UseFormReturn } from 'react-hook-form';

import { computePdas } from '../../pda-generator/compute-pdas';
import type { FormValue, InstructionFormData, InstructionFormFieldNames } from '../../use-instruction-form';
import type { ExternalDependency } from '../types';
import { traverseInstructionAccounts } from './traverse-accounts';

/**
 * Creates a PDA prefill dependency that automatically fills PDA accounts
 * with generated addresses when form values change.
 *
 * This provider watches form arguments and accounts, regenerates PDAs when
 * relevant values change, and fills PDA account fields automatically.
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

            const formValues = form.getValues();
            const pdas = computePdas(idl, instruction, formValues);

            for (const [accountName, path] of pdaAccountPaths.entries()) {
                const pdaData = pdas[accountName];
                if (pdaData?.generated) {
                    const currentValue = form.getValues(path);
                    if (String(currentValue) !== pdaData.generated) {
                        form.setValue(path, pdaData.generated as unknown as FormValue, {
                            shouldDirty: false,
                            shouldValidate: false,
                        });
                    }
                }
            }
        },
        watchesFormValues: true,
    };
}
