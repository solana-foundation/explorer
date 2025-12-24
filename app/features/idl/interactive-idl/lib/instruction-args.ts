import type { ArgField } from '@entities/idl';

export function isRequiredArg(arg: ArgField): boolean {
    return !/^(option|coption)\(/.test(arg.type);
}

export function isArrayArg(arg: ArgField): boolean {
    return /array\(/.test(arg.type);
}

export function isVectorArg(arg: ArgField): boolean {
    return /vec\(/.test(arg.type);
}

export function getArrayMaxLength(arg: ArgField): number | undefined {
    // Match array(type, length) pattern, handling optional wrapping
    // Examples: 'array(u8, 32)', 'option(array(string, 2))', 'coption(array(bool, 3))'
    const match = arg.type.match(/array\s*\(\s*\w+\s*,\s*(\d+)\s*\)/);
    if (match && match[1]) {
        const length = parseInt(match[1], 10);
        return isNaN(length) ? undefined : length;
    }
    return undefined;
}
