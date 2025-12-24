import { PROGRAM_INFO_BY_ID, PROGRAM_NAMES, SPECIAL_IDS, SYSVAR_IDS, TOKEN_IDS } from '@utils/programs';

import type { AutocompleteItem } from './types';

/**
 * Converts a Record<address, label> to an array of AutocompleteItems.
 */
function recordToAutocompleteItems(
    record: Record<string, string>,
    group: string,
    transformLabel?: (label: string) => string
): AutocompleteItem[] {
    return Object.entries(record).map(([value, label]) => ({
        group,
        label: transformLabel ? transformLabel(label) : label,
        value,
    }));
}

const SYSTEM_PROGRAM_NAMES: PROGRAM_NAMES[] = [
    PROGRAM_NAMES.SYSTEM,
    PROGRAM_NAMES.ADDRESS_LOOKUP_TABLE,
    PROGRAM_NAMES.ASSOCIATED_TOKEN,
    PROGRAM_NAMES.COMPUTE_BUDGET,
    PROGRAM_NAMES.CONFIG,
    PROGRAM_NAMES.STAKE,
    PROGRAM_NAMES.VOTE,
];

const PRECOMPILE_NAMES: PROGRAM_NAMES[] = [PROGRAM_NAMES.ED25519, PROGRAM_NAMES.SECP256K1];

const stripProgramSuffix = (name: string): string => name.replace(/ Program$/i, '');
const stripSysvarPrefix = (name: string): string => name.replace(/^Sysvar: /i, '');
const stripPrecompileSuffix = (name: string): string => name.replace(/ SigVerify Precompile$/i, '');

const systemProgramItems: AutocompleteItem[] = Object.entries(PROGRAM_INFO_BY_ID)
    .filter(([, info]) => SYSTEM_PROGRAM_NAMES.includes(info.name as PROGRAM_NAMES))
    .map(([id, info]) => ({
        group: 'Program',
        keywords: ['program'],
        label: stripProgramSuffix(info.name),
        value: id,
    }));

const precompileItems: AutocompleteItem[] = Object.entries(PROGRAM_INFO_BY_ID)
    .filter(([, info]) => PRECOMPILE_NAMES.includes(info.name as PROGRAM_NAMES))
    .map(([id, info]) => ({
        group: 'SigVerify Precompile',
        keywords: ['sigverify'],
        label: stripPrecompileSuffix(info.name),
        value: id,
    }));

const tokenProgramItems = recordToAutocompleteItems(TOKEN_IDS, 'Token Program', stripProgramSuffix);

const sysvarItems = recordToAutocompleteItems(SYSVAR_IDS, 'Sysvar', stripSysvarPrefix);

const specialItems = recordToAutocompleteItems(SPECIAL_IDS, 'Special');

/**
 * Default list of common Solana programs for autocomplete suggestions.
 *
 * This list can be extended by adding new items to the array. Each item should follow
 * the `AutocompleteItem` type structure with appropriate `group`, `keywords`, `label`, and `value`.
 *
 * @see AutocompleteItem for field descriptions
 */
export const DEFAULT_AUTOCOMPLETE_ITEMS: AutocompleteItem[] = [
    // Programs
    ...systemProgramItems,

    // SigVerify Precompiles
    ...precompileItems,

    // Token Programs
    ...tokenProgramItems,

    // Sysvars
    ...sysvarItems,

    // Special
    ...specialItems,
];
