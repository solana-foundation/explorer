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

export function isRequiredArg(arg: ArgField): boolean {
    return !/^(option|coption)\(/.test(arg.type);
}

export function isArrayArg(arg: ArgField): boolean {
    return /array\(/.test(arg.type);
}

export function isVectorArg(arg: ArgField): boolean {
    return /vec\(/.test(arg.type);
}
