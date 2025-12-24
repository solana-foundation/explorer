import type { InstructionData } from '@entities/idl';
import { PROGRAM_INFO_BY_ID, PROGRAM_NAMES } from '@utils/programs';
import type { FieldPath, UseFormReturn } from 'react-hook-form';

import type { FormValue, InstructionFormData, InstructionFormFieldNames } from '../../use-instruction-form';
import { KNOWN_ACCOUNT_PATTERNS, KNOWN_PROGRAM_PATTERNS } from '../const';
import type { ExternalDependency } from '../types';
import { traverseInstructionAccounts } from './traverse-accounts';

// Build address-to-patterns map from PROGRAM_INFO_BY_ID
const KNOWN_ACCOUNTS: Record<string, readonly string[]> = Object.entries(PROGRAM_INFO_BY_ID)
    .filter(([, info]) => info.name in KNOWN_PROGRAM_PATTERNS)
    .reduce(
        (acc, [address, info]) => {
            const patterns = KNOWN_PROGRAM_PATTERNS[info.name as PROGRAM_NAMES];
            if (patterns) {
                acc[address] = patterns;
            }
            return acc;
        },
        { ...KNOWN_ACCOUNT_PATTERNS } as Record<string, readonly string[]>
    );

/**
 * Creates a known accounts prefill dependency that automatically fills
 * known account types (like System Program, Token Program, etc.) with their standard addresses.
 *
 * This provider matches account names against configured patterns and fills them with
 * the corresponding program addresses. Only empty fields are filled to avoid overwriting
 * user input.
 */
export function createKnownAccountsPrefillDependency(
    instruction: InstructionData,
    fieldNames: Pick<InstructionFormFieldNames, 'account'>
): ExternalDependency<string> {
    // Map of program addresses to their field paths
    const programPathsMap = new Map<string, FieldPath<InstructionFormData>[]>();

    traverseInstructionAccounts(instruction, (account, parentGroup) => {
        const programAddress = findKnownAddressForAccount(account.name);
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
        id: 'known-accounts',
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

/**
 * Finds the known program address for a given account name.
 * Returns undefined if the account name doesn't match any known pattern.
 */
export function findKnownAddressForAccount(accountName: string): string | undefined {
    const normalizedName = accountName.toLowerCase().trim();

    for (const [programAddress, patterns] of Object.entries(KNOWN_ACCOUNTS)) {
        if (patterns.some(pattern => normalizedName === pattern.toLowerCase())) {
            return programAddress;
        }
    }

    return undefined;
}
