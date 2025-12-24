import type { InstructionData } from '@entities/idl';
import { PROGRAM_INFO_BY_ID, PROGRAM_NAMES } from '@utils/programs';
import type { FieldPath, UseFormReturn } from 'react-hook-form';

import type { FormValue, InstructionFormData, InstructionFormFieldNames } from '../../use-instruction-form';
import type { ExternalDependency } from '../types';
import { traverseInstructionAccounts } from './traverse-accounts';
import { generateNameVariations } from './utils/generate-name-variations';

/**
 * Configuration for hardcoded program accounts that should be auto-filled.
 * Maps program names to arrays of account name patterns that should match this program.
 *
 * @example
 * To add a new program:
 * 1. Use an existing PROGRAM_NAMES enum value as a key, or add a new one
 * 2. Add an array of name patterns that should match this program
 * 3. Patterns are matched case-insensitively and support common naming conventions
 */
const SYSTEM = ['system', 'program'];
const ASSOCIATED_TOKEN = ['associated', 'token', 'program'];
const ATA = ['ata', 'program'];
const TOKEN = ['token', 'program'];

const HARDCODED_PROGRAM_PATTERNS: Partial<Record<PROGRAM_NAMES, readonly string[]>> = {
    [PROGRAM_NAMES.SYSTEM]: generateNameVariations(SYSTEM, [SYSTEM[0]]),
    [PROGRAM_NAMES.ASSOCIATED_TOKEN]: [
        ...generateNameVariations(ASSOCIATED_TOKEN, [ASSOCIATED_TOKEN[0]]),
        ...generateNameVariations(ATA, [ATA[0]]),
    ],
    [PROGRAM_NAMES.TOKEN]: generateNameVariations(TOKEN, [TOKEN[0]]),
};

// Build address-to-patterns map from PROGRAM_INFO_BY_ID
const HARDCODED_PROGRAMS: Record<string, readonly string[]> = Object.entries(PROGRAM_INFO_BY_ID)
    .filter(([, info]) => info.name in HARDCODED_PROGRAM_PATTERNS)
    .reduce((acc, [address, info]) => {
        const patterns = HARDCODED_PROGRAM_PATTERNS[info.name as PROGRAM_NAMES];
        if (patterns) {
            acc[address] = patterns;
        }
        return acc;
    }, {} as Record<string, readonly string[]>);

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
