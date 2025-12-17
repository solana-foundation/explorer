import type { InstructionData } from '@entities/idl';
import { PublicKey } from '@solana/web3.js';
import type { FieldPath, UseFormReturn } from 'react-hook-form';

import type { FormValue, InstructionFormData, InstructionFormFieldNames } from '../../use-instruction-form';
import type { ExternalDependency } from '../types';
import { traverseInstructionAccounts } from './traverse-accounts';

/**
 * Creates a wallet prefill dependency that automatically fills signer accounts
 * with the wallet's public key when the wallet connects or changes.
 */
export function createWalletPrefillDependency(
    instruction: InstructionData,
    publicKey: PublicKey | null,
    fieldNames: Pick<InstructionFormFieldNames, 'account'>
): ExternalDependency<PublicKey> {
    const signerPaths: FieldPath<InstructionFormData>[] = [];

    traverseInstructionAccounts(instruction, (account, parentGroup) => {
        if (account.signer) {
            if (parentGroup) {
                signerPaths.push(fieldNames.account(parentGroup, account));
            } else {
                signerPaths.push(fieldNames.account(account));
            }
        }
    });

    return {
        getValue: () => publicKey,
        id: 'wallet',
        onValueChange: (value: unknown, form: UseFormReturn<InstructionFormData>) => {
            if (!value || !(value instanceof PublicKey)) return;

            const walletAddress = value.toBase58();

            for (const path of signerPaths) {
                form.setValue(path, walletAddress as unknown as FormValue, {
                    shouldDirty: false,
                    shouldValidate: false,
                });
            }
        },
    };
}
