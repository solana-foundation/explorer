// Type-level payload inference from the IDL itself. Works when the IDL is a compile-time
// literal (anchor-generated types, or generated codama literal modules); runtime-fetched IDLs
// type as the wide AnchorIdl/CodamaIdl and every shape below deliberately degrades to `unknown`.
import type { Address, ReadonlyUint8Array } from '@solana/kit';
import type { CamelCaseString } from 'codama';

import type { AnchorIdl, SupportedIdlInput } from '../types.js';

/** The [encoding, data] pair @codama/dynamic-parsers emits for every byte field. */
type DecodedBytes = [encoding: string, data: string];

/**
 * Bridges @codama/renderers-js-generated types (build-time codegen, type-only imports) to what
 * @codama/dynamic-parsers actually returns: branded addresses decode as plain base58 strings, byte
 * fields as `DecodedBytes` tuples; kit Option objects and bigints already match.
 */
export type AsDecoded<T> = T extends Address
    ? string
    : T extends ReadonlyUint8Array | Uint8Array
      ? DecodedBytes
      : T extends bigint | boolean | number | string
        ? T
        : T extends readonly (infer E)[]
          ? AsDecoded<E>[]
          : T extends object
            ? { [K in keyof T]: AsDecoded<T[K]> }
            : T;

// Matches the CODAMA runtime output — bigint for 64/128-bit ints, base58 string for pubkeys — NOT anchor's BN mapping.
type ScalarMap = {
    bool: boolean;
    bytes: DecodedBytes;
    f32: number;
    f64: number;
    i8: number;
    i16: number;
    i32: number;
    i64: bigint;
    i128: bigint;
    i256: bigint;
    pubkey: string;
    string: string;
    u8: number;
    u16: number;
    u32: number;
    u64: bigint;
    u128: bigint;
    u256: bigint;
};

// Non-scalar field types (defined/vec/option/…) stay unknown until they are needed.
type FieldType<T> = T extends keyof ScalarMap ? ScalarMap[T] : unknown;

// A no-field payload (a no-args instruction, an empty struct) — a real empty object, not the `{}` top type.
type EmptyStruct = Record<string, never>;

type FieldsObject<F> = F extends readonly { name: string; type: unknown }[]
    ? string extends F[number]['name']
        ? unknown // wide IDL — field names are not literal
        : F extends readonly []
          ? EmptyStruct
          : { [Item in F[number] as Item['name'] & string]: FieldType<Item['type']> }
    : unknown;

// Wide codama IDLs carry branded names (CamelCaseString); literal IDLs carry plain literals.
type IsLiteralName<N> = CamelCaseString extends N ? false : string extends N ? false : N extends string ? true : false;

type CodamaNumber<F> = F extends 'i64' | 'i128' | 'i256' | 'u64' | 'u128' | 'u256' ? bigint : number;

// Flattens intersections so inferred enum variants hover as one object literal.
type Flat<T> = { [K in keyof T]: T[K] };

// Data enums decode as kit discriminated unions — `__kind` carries the capitalized variant name.
type EnumVariantValue<TRoot, V> = V extends { kind: 'enumEmptyVariantTypeNode'; name: infer N }
    ? IsLiteralName<N> extends true
        ? { __kind: Capitalize<N & string> }
        : unknown
    : V extends { kind: 'enumStructVariantTypeNode'; name: infer N; struct: infer S }
      ? IsLiteralName<N> extends true
          ? Flat<{ __kind: Capitalize<N & string> } & CodamaValue<TRoot, S>>
          : unknown
      : V extends { kind: 'enumTupleVariantTypeNode'; name: infer N; tuple: infer T }
        ? IsLiteralName<N> extends true
            ? { __kind: Capitalize<N & string>; fields: CodamaValue<TRoot, T> }
            : unknown
        : unknown;

// @codama/dynamic-parsers types decoded `data` as `unknown`; reconstruct the payload from the IDL node
// types to match the parser's runtime shape. Unsupported kinds degrade to `unknown`.
export type CodamaValue<TRoot, TNode> = TNode extends { format: infer F; kind: 'numberTypeNode' }
    ? CodamaNumber<F>
    : TNode extends { kind: 'publicKeyTypeNode' }
      ? string
      : TNode extends { kind: 'stringTypeNode' }
        ? string
        : TNode extends { kind: 'booleanTypeNode' }
          ? boolean
          : TNode extends { kind: 'bytesTypeNode' }
            ? DecodedBytes
            : TNode extends {
                    kind:
                        | 'fixedSizeTypeNode'
                        | 'hiddenPrefixTypeNode'
                        | 'hiddenSuffixTypeNode'
                        | 'postOffsetTypeNode'
                        | 'preOffsetTypeNode'
                        | 'sentinelTypeNode'
                        | 'sizePrefixTypeNode';
                    type: infer Inner;
                }
              ? CodamaValue<TRoot, Inner>
              : TNode extends { kind: 'amountTypeNode' | 'dateTimeTypeNode' | 'solAmountTypeNode'; number: infer Inner }
                ? CodamaValue<TRoot, Inner>
                : TNode extends {
                        item: infer Item;
                        kind: 'optionTypeNode' | 'remainderOptionTypeNode' | 'zeroableOptionTypeNode';
                    }
                  ? { __option: 'None' } | { __option: 'Some'; value: CodamaValue<TRoot, Item> }
                  : TNode extends { item: infer Item; kind: 'arrayTypeNode' | 'setTypeNode' }
                    ? CodamaValue<TRoot, Item>[] // sets decode as plain arrays
                    : TNode extends { kind: 'mapTypeNode'; value: infer Value }
                      ? Record<string, CodamaValue<TRoot, Value>> // maps decode as plain objects — keys stringify
                      : TNode extends { items: infer Items extends readonly unknown[]; kind: 'tupleTypeNode' }
                        ? { -readonly [K in keyof Items]: CodamaValue<TRoot, Items[K]> } // decoded tuples are mutable arrays
                        : TNode extends { fields: infer F; kind: 'structTypeNode' }
                          ? CodamaFieldsObject<TRoot, F>
                          : TNode extends { kind: 'enumTypeNode'; variants: infer V }
                            ? V extends readonly { kind: 'enumEmptyVariantTypeNode' }[]
                                ? number // scalar enums decode to the variant index
                                : V extends readonly unknown[]
                                  ? EnumVariantValue<TRoot, V[number]>
                                  : unknown
                            : TNode extends { kind: 'definedTypeLinkNode'; name: infer N }
                              ? ResolveDefinedType<TRoot, N>
                              : unknown;

type CodamaFieldsObject<TRoot, F> = F extends readonly { name: string; type: unknown }[]
    ? F extends readonly []
        ? EmptyStruct
        : IsLiteralName<F[number]['name']> extends false
          ? unknown // wide IDL — field names are not literal
          : { [Item in F[number] as Item['name'] & string]: CodamaValue<TRoot, Item['type']> }
    : unknown;

type ResolveDefinedType<TRoot, N> = TRoot extends { program: { definedTypes: readonly (infer D)[] } }
    ? Extract<D, { name: N }> extends { type: infer TN }
        ? CodamaValue<TRoot, TN>
        : unknown
    : unknown;

/** Decoded instruction payload derived from the IDL type — the union of every instruction's args. */
export type InstructionDataOf<T extends SupportedIdlInput> = T extends AnchorIdl
    ? FieldsObject<T['instructions'][number]['args']>
    : T extends { program: { instructions: readonly (infer I)[] } }
      ? I extends { arguments: infer A; name: infer N }
          ? IsLiteralName<N> extends true
              ? CodamaFieldsObject<T, A>
              : unknown // wide IDL — bail before recursing into codama's self-referential node types
          : unknown
      : unknown;

/**
 * Decoded account payloads keyed by account name — `AccountsDataOf<typeof idl>['config']`. Literal
 * (`as const`) codama roots only; wide runtime IDLs degrade to `unknown`. Shapes mirror what the
 * parser RETURNS (see `AsDecoded` for the codec-view differences).
 */
export type AccountsDataOf<T extends SupportedIdlInput> = T extends { program: { accounts: readonly (infer A)[] } }
    ? IsLiteralName<A extends { name: infer N } ? N : never> extends true
        ? {
              [Acc in A as Acc extends { name: infer N extends string } ? N : never]: Acc extends { data: infer D }
                  ? CodamaValue<T, D>
                  : unknown;
          }
        : unknown // wide IDL — bail before recursing into codama's self-referential node types
    : unknown;

/** Decoded account payload derived from the IDL type — the union of every declared account struct. */
export type AccountDataOf<T extends SupportedIdlInput> = T extends AnchorIdl
    ? T extends { accounts: readonly { name: infer N }[]; types: readonly (infer TD)[] }
        ? string extends N
            ? unknown // wide IDL — account names are not literal
            : Extract<TD, { name: N }> extends { type: { fields: infer F } }
              ? FieldsObject<F>
              : unknown
        : unknown
    : T extends { program: { accounts: readonly (infer A)[] } }
      ? A extends { data: infer D; name: infer N }
          ? IsLiteralName<N> extends true
              ? CodamaValue<T, D>
              : unknown // wide IDL — bail before recursing into codama's self-referential node types
          : unknown
      : unknown;
