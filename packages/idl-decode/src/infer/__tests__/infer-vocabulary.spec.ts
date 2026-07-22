// The exhaustiveness contract for CodamaValue: every codama type-node kind must be accounted for.
// A codama bump that introduces a new kind fails HERE — compile time via the Exclude-never checks,
// runtime via the registry diff — instead of silently degrading payload inference to `unknown`.
import { REGISTERED_TYPE_NODE_KINDS, STANDALONE_TYPE_NODE_KINDS, type TypeNode } from 'codama';
import { describe, expect, expectTypeOf, it } from 'vitest';

// every kind CodamaValue maps directly (the composable form — what field/argument `type`s can be)
const MAPPED_DIRECTLY = [
    'amountTypeNode',
    'arrayTypeNode',
    'booleanTypeNode',
    'bytesTypeNode',
    'dateTimeTypeNode',
    'definedTypeLinkNode',
    'enumTypeNode',
    'fixedSizeTypeNode',
    'hiddenPrefixTypeNode',
    'hiddenSuffixTypeNode',
    'mapTypeNode',
    'numberTypeNode',
    'optionTypeNode',
    'postOffsetTypeNode',
    'preOffsetTypeNode',
    'publicKeyTypeNode',
    'remainderOptionTypeNode',
    'sentinelTypeNode',
    'setTypeNode',
    'sizePrefixTypeNode',
    'solAmountTypeNode',
    'stringTypeNode',
    'structTypeNode',
    'tupleTypeNode',
    'zeroableOptionTypeNode',
] as const;

// kinds that only occur inside a parent mapping (variants inside enumTypeNode, fields inside structTypeNode)
const MAPPED_VIA_PARENT = [
    'enumEmptyVariantTypeNode',
    'enumStructVariantTypeNode',
    'enumTupleVariantTypeNode',
    'structFieldTypeNode',
] as const;

type MappedDirectly = (typeof MAPPED_DIRECTLY)[number];

describe('CodamaValue type-node vocabulary', () => {
    it('should map every composable type-node kind and nothing stale', () => {
        // compile time: a new TypeNode kind (or a removed one) breaks these before any test runs
        expectTypeOf<Exclude<TypeNode['kind'], MappedDirectly>>().toBeNever();
        expectTypeOf<Exclude<MappedDirectly, TypeNode['kind']>>().toBeNever();
        // runtime: the same contract against the vocabulary the installed codama actually registers
        // (standalone kinds + the link node — codama 1.5 has no combined TYPE_NODE_KINDS export yet)
        expect(new Set(MAPPED_DIRECTLY)).toEqual(new Set([...STANDALONE_TYPE_NODE_KINDS, 'definedTypeLinkNode']));
        expect(MAPPED_DIRECTLY).toHaveLength(STANDALONE_TYPE_NODE_KINDS.length + 1);
    });

    it('should account for every registered type-shaped kind incl. the parent-mapped ones', () => {
        const covered = [...MAPPED_DIRECTLY, ...MAPPED_VIA_PARENT].filter(kind => kind !== 'definedTypeLinkNode');
        expect(new Set(covered)).toEqual(new Set(REGISTERED_TYPE_NODE_KINDS));
        expect(covered).toHaveLength(REGISTERED_TYPE_NODE_KINDS.length);
    });
});
