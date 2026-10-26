import type { IdlConst, IdlType, IdlTypeArray } from '@coral-xyz/anchor/dist/cjs/idl';

import { safeJsonParse } from '../../lib/utils';
import type { ConstantData } from './formatted-idl';

export function parseIdlType(type: IdlType): string {
    if (typeof type === 'string') return type;
    if ('defined' in type) {
        return typeof type.defined === 'string' ? type.defined : type.defined.name;
    }
    if ('array' in type) return renderArray(type);
    if ('vec' in type) return `vec(${parseIdlType(type.vec)})`;
    if ('option' in type) return `option(${parseIdlType(type.option)})`;
    if ('coption' in type) return `coption(${parseIdlType(type.coption)})`;
    return JSON.stringify(type);
}

function renderArray(arrayType: IdlTypeArray) {
    return `array(${parseIdlType(arrayType.array[0])}, ${getArrayTypeLen(arrayType.array[1])})`;
}

function getArrayTypeLen(arrayLen: IdlTypeArray['array'][1]) {
    if (typeof arrayLen === 'number') {
        return arrayLen;
    } else if ('generic' in arrayLen) {
        return arrayLen.generic;
    } else {
        return JSON.stringify(arrayLen);
    }
}

export function formatConstants(constants?: readonly IdlConst[]): ConstantData[] | undefined {
    return constants?.map(constant => ({
        docs: (constant as { docs?: string[] }).docs || [],
        name: constant.name,
        type: parseIdlType(constant.type),
        value: safeJsonParse(constant.value),
    }));
}
