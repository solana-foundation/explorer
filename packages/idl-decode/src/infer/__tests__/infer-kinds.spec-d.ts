// One assertion per CodamaValue mapping — the decode shapes were verified against
// @codama/dynamic-codecs roundtrips (scalar enums → index, data enums → {__kind: Capitalized},
// maps → plain objects, sets → arrays, bytes → [encoding, data] tuples, options → kit {__option}).
import { describe, expectTypeOf, it } from 'vitest';

import type { AccountsDataOf, CodamaValue } from '../index';

// codama's builders (numberTypeNode('u8'), …) would produce these, but the subject is `as const`
// literal-document inference — and builders brand names as CamelCaseString, IsLiteralName's wide-document signal.
const u8 = { format: 'u8', kind: 'numberTypeNode' } as const;
const u64 = { format: 'u64', kind: 'numberTypeNode' } as const;
const bool = { kind: 'booleanTypeNode', size: u8 } as const;
const pubkey = { kind: 'publicKeyTypeNode' } as const;

// a minimal root carrying one defined type — exercises definedTypeLinkNode resolution
const root = {
    program: {
        definedTypes: [{ kind: 'definedTypeNode', name: 'chainId', type: { fields: [], kind: 'structTypeNode' } }],
    },
} as const;
type Root = typeof root;

type Value<TNode> = CodamaValue<Root, TNode>;
type OptionOf<T> = { __option: 'None' } | { __option: 'Some'; value: T };

describe('CodamaValue per-kind decode shapes', () => {
    it('should map scalar leaves to their dynamic-parsers output', () => {
        expectTypeOf<Value<typeof u8>>().toEqualTypeOf<number>();
        expectTypeOf<Value<typeof u64>>().toEqualTypeOf<bigint>();
        expectTypeOf<Value<typeof pubkey>>().toEqualTypeOf<string>();
        expectTypeOf<Value<{ encoding: 'utf8'; kind: 'stringTypeNode' }>>().toEqualTypeOf<string>();
        expectTypeOf<Value<typeof bool>>().toEqualTypeOf<boolean>();
        expectTypeOf<Value<{ kind: 'bytesTypeNode' }>>().toEqualTypeOf<[string, string]>();
    });

    it('should unwrap the size/offset/sentinel wrappers to the inner type', () => {
        expectTypeOf<Value<{ kind: 'fixedSizeTypeNode'; size: 8; type: typeof u64 }>>().toEqualTypeOf<bigint>();
        expectTypeOf<
            Value<{ kind: 'sizePrefixTypeNode'; prefix: typeof u8; type: typeof u64 }>
        >().toEqualTypeOf<bigint>();
        expectTypeOf<Value<{ kind: 'hiddenPrefixTypeNode'; prefix: []; type: typeof u64 }>>().toEqualTypeOf<bigint>();
        expectTypeOf<Value<{ kind: 'hiddenSuffixTypeNode'; suffix: []; type: typeof u64 }>>().toEqualTypeOf<bigint>();
        expectTypeOf<Value<{ kind: 'preOffsetTypeNode'; offset: 4; type: typeof u64 }>>().toEqualTypeOf<bigint>();
        expectTypeOf<Value<{ kind: 'postOffsetTypeNode'; offset: 4; type: typeof u64 }>>().toEqualTypeOf<bigint>();
        expectTypeOf<
            Value<{ kind: 'sentinelTypeNode'; sentinel: unknown; type: typeof u64 }>
        >().toEqualTypeOf<bigint>();
    });

    it('should unwrap the semantic number wrappers to the inner number type', () => {
        expectTypeOf<Value<{ decimals: 9; kind: 'amountTypeNode'; number: typeof u64 }>>().toEqualTypeOf<bigint>();
        expectTypeOf<Value<{ kind: 'dateTimeTypeNode'; number: typeof u64 }>>().toEqualTypeOf<bigint>();
        expectTypeOf<Value<{ kind: 'solAmountTypeNode'; number: typeof u64 }>>().toEqualTypeOf<bigint>();
    });

    it('should map every option flavor to the kit Option object', () => {
        expectTypeOf<Value<{ item: typeof u64; kind: 'optionTypeNode' }>>().toEqualTypeOf<OptionOf<bigint>>();
        expectTypeOf<Value<{ item: typeof u64; kind: 'zeroableOptionTypeNode' }>>().toEqualTypeOf<OptionOf<bigint>>();
        expectTypeOf<Value<{ item: typeof u64; kind: 'remainderOptionTypeNode' }>>().toEqualTypeOf<OptionOf<bigint>>();
    });

    it('should map the collection kinds to their plain JS decode shapes', () => {
        expectTypeOf<Value<{ count: unknown; item: typeof u64; kind: 'arrayTypeNode' }>>().toEqualTypeOf<bigint[]>();
        expectTypeOf<Value<{ count: unknown; item: typeof u64; kind: 'setTypeNode' }>>().toEqualTypeOf<bigint[]>();
        expectTypeOf<Value<{ count: unknown; key: typeof u8; kind: 'mapTypeNode'; value: typeof u64 }>>().toEqualTypeOf<
            Record<string, bigint>
        >();
        expectTypeOf<Value<{ items: readonly [typeof u64, typeof bool]; kind: 'tupleTypeNode' }>>().toEqualTypeOf<
            [bigint, boolean]
        >();
    });

    it('should map structs and defined-type links through the root', () => {
        expectTypeOf<
            Value<{
                fields: readonly [{ kind: 'structFieldTypeNode'; name: 'amount'; type: typeof u64 }];
                kind: 'structTypeNode';
            }>
        >().toEqualTypeOf<{ amount: bigint }>();
        expectTypeOf<Value<{ kind: 'definedTypeLinkNode'; name: 'chainId' }>>().toEqualTypeOf<Record<string, never>>();
    });

    // one case per parent-mapped kind (MAPPED_VIA_PARENT in infer-vocabulary.spec.ts)
    describe('variant kinds mapped via the parent enum/struct', () => {
        // variants only decode as {__kind} members inside a MIXED enum — an all-empty enum is scalar
        type Mixed = Value<{
            kind: 'enumTypeNode';
            variants: readonly [
                { kind: 'enumEmptyVariantTypeNode'; name: 'empty' },
                {
                    kind: 'enumStructVariantTypeNode';
                    name: 'shaped';
                    struct: {
                        fields: readonly [{ kind: 'structFieldTypeNode'; name: 'amount'; type: typeof u64 }];
                        kind: 'structTypeNode';
                    };
                },
                {
                    kind: 'enumTupleVariantTypeNode';
                    name: 'pair';
                    tuple: { items: readonly [typeof u8, typeof u8]; kind: 'tupleTypeNode' };
                },
            ];
        }>;

        it('should map an empty variant to a bare capitalized __kind member', () => {
            expectTypeOf<Extract<Mixed, { __kind: 'Empty' }>>().toEqualTypeOf<{ __kind: 'Empty' }>();
        });

        it('should map a struct variant to __kind with the fields spread flat', () => {
            expectTypeOf<Extract<Mixed, { __kind: 'Shaped' }>>().toEqualTypeOf<{
                __kind: 'Shaped';
                amount: bigint;
            }>();
        });

        it('should map a tuple variant to __kind with the values nested under fields', () => {
            expectTypeOf<Extract<Mixed, { __kind: 'Pair' }>>().toEqualTypeOf<{
                __kind: 'Pair';
                fields: [number, number];
            }>();
        });

        it('should map a struct field through its parent struct', () => {
            expectTypeOf<
                Value<{
                    fields: readonly [{ kind: 'structFieldTypeNode'; name: 'bump'; type: typeof u8 }];
                    kind: 'structTypeNode';
                }>
            >().toEqualTypeOf<{ bump: number }>();
        });

        it('should degrade variants of a wide document to unknown', () => {
            // runtime-fetched enums carry non-literal variant names — no {__kind} guidance to fabricate
            expectTypeOf<
                Value<{
                    kind: 'enumTypeNode';
                    variants: readonly {
                        kind: 'enumEmptyVariantTypeNode' | 'enumStructVariantTypeNode';
                        name: string;
                    }[];
                }>
            >().toBeUnknown();
        });
    });

    it('should key decoded account payloads by account name', () => {
        type VaultRoot = {
            kind: 'rootNode';
            program: {
                accounts: readonly [
                    {
                        data: {
                            fields: readonly [{ kind: 'structFieldTypeNode'; name: 'amount'; type: typeof u64 }];
                            kind: 'structTypeNode';
                        };
                        kind: 'accountNode';
                        name: 'vault';
                    },
                ];
                definedTypes: readonly [];
                instructions: readonly [];
                name: 'p';
                publicKey: string;
                version: string;
            };
        };
        expectTypeOf<AccountsDataOf<VaultRoot>['vault']>().toEqualTypeOf<{ amount: bigint }>();
        // wide IDLs carry branded names — the whole map degrades before any recursion
        expectTypeOf<
            AccountsDataOf<{
                kind: 'rootNode';
                program: {
                    accounts: readonly { data: unknown; kind: 'accountNode'; name: string }[];
                    definedTypes: readonly unknown[];
                    instructions: readonly unknown[];
                    name: string;
                    publicKey: string;
                    version: string;
                };
            }>
        >().toBeUnknown();
    });

    it('should map scalar enums to the variant index and data enums to the kit discriminated union', () => {
        expectTypeOf<
            Value<{
                kind: 'enumTypeNode';
                variants: readonly [
                    { kind: 'enumEmptyVariantTypeNode'; name: 'locking' },
                    { kind: 'enumEmptyVariantTypeNode'; name: 'burning' },
                ];
            }>
        >().toEqualTypeOf<number>();
        expectTypeOf<
            Value<{
                kind: 'enumTypeNode';
                variants: readonly [
                    { kind: 'enumEmptyVariantTypeNode'; name: 'empty' },
                    {
                        kind: 'enumStructVariantTypeNode';
                        name: 'shaped';
                        struct: {
                            fields: readonly [{ kind: 'structFieldTypeNode'; name: 'amount'; type: typeof u64 }];
                            kind: 'structTypeNode';
                        };
                    },
                    {
                        kind: 'enumTupleVariantTypeNode';
                        name: 'pair';
                        tuple: { items: readonly [typeof u8, typeof u8]; kind: 'tupleTypeNode' };
                    },
                ];
            }>
        >().toEqualTypeOf<
            { __kind: 'Empty' } | { __kind: 'Shaped'; amount: bigint } | { __kind: 'Pair'; fields: [number, number] }
        >();
    });
});
