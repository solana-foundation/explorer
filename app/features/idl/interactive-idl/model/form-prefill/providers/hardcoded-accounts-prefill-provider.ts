import type { InstructionData } from '@entities/idl';
import type { FieldPath, UseFormReturn } from 'react-hook-form';

import type { FormValue, InstructionFormData, InstructionFormFieldNames } from '../../use-instruction-form';
import type { ExternalDependency } from '../types';
import { traverseInstructionAccounts } from './traverse-accounts';

/**
 * Configuration for hardcoded program accounts that should be auto-filled.
 * Maps program addresses to arrays of account name patterns that should match this program.
 *
 * @example
 * To add a new program (e.g., Token Program):
 * 1. Add the program address as a key
 * 2. Add an array of name patterns that should match this program
 * 3. Patterns are matched case-insensitively and support common naming conventions
 */
const HARDCODED_PROGRAMS: Record<string, readonly string[]> = {
    // System Program
    '11111111111111111111111111111111': [
        'systemProgram',
        'system_program',
        'system program',
        'systemprogram',
        'system',
    ],

    // Associated Token Program
    ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL: [
        'associatedTokenProgram',
        'associated_token_program',
        'associated token program',
        'associatedtokenprogram',
        'ataProgram',
        'ata_program',
        'ata program',
        'ataprogram',
    ],

    // Token Program
    TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: [
        'tokenProgram',
        'token_program',
        'token program',
        'tokenprogram',
        'token',
    ],
} as const;

/**
 * Creates a hardcoded accounts prefill dependency that automatically fills
 * known account types (like System Program, Token Program, etc.) with their standard addresses.
 *
 * This provider matches account names against configured patterns and fills them with
 * the corresponding program addresses. Only empty fields are filled to avoid overwriting
 * user input.
 */
export function createHardcodedAccountsPrefillDependency(
    instruction: InstructionData,
    fieldNames: Pick<InstructionFormFieldNames, 'account'>
): ExternalDependency<string> {
    // Map of program addresses to their field paths
    const programPathsMap = new Map<string, FieldPath<InstructionFormData>[]>();

    traverseInstructionAccounts(instruction, (account, parentGroup) => {
        const programAddress = findProgramAddressForAccount(account.name);
        if (programAddress) {
            const paths = programPathsMap.get(programAddress) || [];
            if (parentGroup) {
                paths.push(fieldNames.account(parentGroup, account));
            } else {
                paths.push(fieldNames.account(account));
            }
            programPathsMap.set(programAddress, paths);
        }
    });

    const instructionKey = instruction.name;

    return {
        getValue: () => instructionKey,
        id: 'hardcoded-accounts',
        onValueChange: (_value: unknown, form: UseFormReturn<InstructionFormData>) => {
            for (const [programAddress, paths] of programPathsMap.entries()) {
                for (const path of paths) {
                    const currentValue = form.getValues(path);
                    if (!currentValue || String(currentValue).trim() === '') {
                        form.setValue(path, programAddress as unknown as FormValue, {
                            shouldDirty: false,
                            shouldValidate: false,
                        });
                    }
                }
            }
        },
    };
}

function findProgramAddressForAccount(accountName: string): string | undefined {
    const normalizedName = accountName.toLowerCase().trim();

    for (const [programAddress, patterns] of Object.entries(HARDCODED_PROGRAMS)) {
        if (patterns.some(pattern => normalizedName === pattern.toLowerCase())) {
            return programAddress;
        }
    }

    return undefined;
}
