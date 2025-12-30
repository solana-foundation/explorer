import type { IdlType } from '@coral-xyz/anchor/dist/cjs/idl';
import type { ArgField } from '@entities/idl';

/**
 * Extract array length from an IdlType.
 * Handles option/coption wrapping and returns the numeric length if available.
 */
export function getArrayLengthFromIdlType(type: IdlType): number | undefined {
    if (typeof type === 'string') return undefined;

    // Unwrap option/coption
    let inner: IdlType = type;
    if ('option' in type) inner = type.option;
    else if ('coption' in type) inner = type.coption;

    // Check for array
    if (typeof inner === 'object' && 'array' in inner) {
        const len = inner.array[1];
        // len is IdlArrayLen: number | { generic: string }
        return typeof len === 'number' ? len : undefined;
    }

    return undefined;
}

function isOptionalIdlType(type: IdlType): boolean {
    if (typeof type !== 'object') return false;
    return 'option' in type || 'coption' in type;
}

export function isRequiredArg(arg: ArgField): boolean {
    // Check rawType first if available (more reliable)
    if (arg.rawType !== undefined) {
        return !isOptionalIdlType(arg.rawType);
    }
    // Fallback to regex on type string (lowercased for case-insensitivity)
    // eslint-disable-next-line no-restricted-syntax -- use a fallback regexp to check if the field is require
    return !/^(option|coption)\(/.test(arg.type.toLowerCase());
}

function hasArrayInIdlType(type: IdlType): boolean {
    if (typeof type !== 'object') return false;
    if ('array' in type) return true;
    if ('option' in type) return hasArrayInIdlType(type.option);
    if ('coption' in type) return hasArrayInIdlType(type.coption);
    return false;
}

export function isArrayArg(arg: ArgField): boolean {
    // Check rawType first if available (more reliable)
    if (arg.rawType !== undefined) {
        return hasArrayInIdlType(arg.rawType);
    }
    // Fallback to regex on type string (lowercased for case-insensitivity)
    // eslint-disable-next-line no-restricted-syntax -- use a fallback regexp to check if the field is require
    return /array\(/.test(arg.type.toLowerCase());
}

function hasVecInIdlType(type: IdlType): boolean {
    if (typeof type !== 'object') return false;
    if ('vec' in type) return true;
    if ('option' in type) return hasVecInIdlType(type.option);
    if ('coption' in type) return hasVecInIdlType(type.coption);
    return false;
}

export function isVectorArg(arg: ArgField): boolean {
    // Check rawType first if available (more reliable)
    if (arg.rawType !== undefined) {
        return hasVecInIdlType(arg.rawType);
    }
    // Fallback to regex on type string (lowercased for case-insensitivity)
    // eslint-disable-next-line no-restricted-syntax -- use a fallback regexp to check if the field is require
    return /vec\(/.test(arg.type.toLowerCase());
}
