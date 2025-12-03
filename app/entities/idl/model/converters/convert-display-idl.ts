import type { IdlType, IdlTypeDefined } from '@coral-xyz/anchor/dist/cjs/idl';

import {
    getIdlSpecType as getSerdeIdlSpecType,
    type IdlSpec as LegacyIdlSpec,
    type LegacyIdlType,
    type TupleType,
} from '../converters/convert-legacy-idl';
import {
    convertLegacyIdl,
    internalConvertDefinedTypeArg as convertDefinedTypeArg,
} from '../converters/convert-legacy-idl';

export type DisplayIdlSpecKey = LegacyIdlSpec | 'legacy-shank';

export type DisplayIdlType = LegacyIdlType | { tuple: TupleType } | { option: { tuple: TupleType } };

type ShankIdlType = { tuple: TupleType };

export type LegacyOrShankIdlType = LegacyIdlType | ShankIdlType;

function convertType(type: LegacyOrShankIdlType): IdlType {
    if (typeof type === 'string') {
        return type === 'publicKey' ? 'pubkey' : type;
    } else if ('vec' in type) {
        return { vec: convertType(type.vec) };
    } else if ('option' in type) {
        return { option: convertType(type.option) };
    } else if ('defined' in type) {
        return { defined: { generics: [], name: type.defined } } as IdlTypeDefined;
    } else if ('array' in type) {
        return { array: [convertType(type.array[0]), type.array[1]] };
    } else if ('generic' in type) {
        return type;
    } else if ('definedWithTypeArgs' in type) {
        return {
            defined: {
                generics: type.definedWithTypeArgs.args.map(convertDefinedTypeArg),
                name: type.definedWithTypeArgs.name,
            },
        } as IdlTypeDefined;
    } else if ('tuple' in type) {
        // Use generic type to display tuple as it is not covered by IdlType
        return {
            defined: {
                generics: type.tuple.map(t => ({ kind: 'type', type: convertType(t) })),
                name: `tuple[${type.tuple[0]}]`,
            },
        };
    }
    throw new Error(`Unsupported type: ${JSON.stringify(type)}`);
}

export type IdlSpec = LegacyIdlSpec | 'legacy-shank';

export function getIdlSpecType(idl: any): IdlSpec {
    const parentIdlSpecType = getSerdeIdlSpecType(idl);

    const isIdlFromShank = (idl: any) => idl?.metadata?.origin === 'shank';

    // we allow to return specific version for legacy IDLs
    const allowInferLegacyIdlVariations = parentIdlSpecType === 'legacy';

    if (allowInferLegacyIdlVariations && isIdlFromShank(idl)) return 'legacy-shank';

    // preserve original IDL type if not legacy
    return parentIdlSpecType;
}

/// export part of the internal implementation to preserve existing functonality to display the IDL
export const convertDisplayIdl = convertLegacyIdl;
export const privateConvertType = convertType;
