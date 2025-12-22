import type { ArgField } from '@entities/idl';

const OPTION_PREFIX = /^option\(/;
const COPTION_PREFIX = /^coption\(/;
const ARRAY_PATTERN = /array\(/;
const VEC_PATTERN = /vec\(/;

// Matches array length: array( type , length ) with optional option/coption wrapper
// Captures length in group 1
const ARRAY_LENGTH = /^(?:c?option\()?array\(\s*\w+\s*,\s*(\d+)\s*\)/;

export function isRequiredArg(arg: ArgField): boolean {
    return !OPTION_PREFIX.test(arg.type) && !COPTION_PREFIX.test(arg.type);
}

export function isArrayArg(arg: ArgField): boolean {
    return ARRAY_PATTERN.test(arg.type);
}

export function isVectorArg(arg: ArgField): boolean {
    return VEC_PATTERN.test(arg.type);
}

/**
 * Extract the fixed length from an array type.
 * Handles: 'array(u8, 32)', 'option(array(string, 2))', 'coption(array(bool, 3))'
 */
export function getArrayMaxLength(arg: ArgField): number | undefined {
    const match = arg.type.match(ARRAY_LENGTH);
    if (match?.[1]) {
        const length = parseInt(match[1], 10);
        return isNaN(length) ? undefined : length;
    }
    return undefined;
}
