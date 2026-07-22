import {
    findFirstNodeFromPath,
    getLastNodeFromPath,
    type NestedTypeNode,
    resolveNestedTypeNode,
    type RootNode,
    type TypeNode,
} from 'codama';

import { IDL_ERROR__DECODE_KIND_MISMATCH, IdlError } from '../errors.js';
import { type AccountDecode, IdlStandard, type InstructionDecode } from '../types.js';

/** One decoded leaf paired with its schema — the runtime counterpart of the literal-IDL inference. */
export type DecodedEntry = {
    /** Field names, array indices, and map keys from the payload root to the leaf. */
    path: readonly (number | string)[];
    /** The leaf's resolved type node — semantic wrappers (amount/solAmount/dateTime) and enums arrive intact. */
    node: TypeNode;
    /** The decoded leaf value as the parser returned it; `undefined` only for an option that decoded to None. */
    value: unknown;
};

/**
 * Flatten the default (codama) arm's decoded payload into schema-paired leaves — render, extract,
 * or diff by node kind without claiming a payload type (links resolved against the decode's own
 * root, size wrappers penetrated, options unwrapped). Any other arm throws the same typed
 * kind-mismatch IdlError as `unwrap`.
 *
 * @example
 * ```ts
 * const entries = getDecodedEntries(client.decodeAccount(bytes));
 * // [{ path: ['mode'], node: { kind: 'enumTypeNode', … }, value: 1 }, { path: ['chainId', 'id'], … }, …]
 * ```
 */
export function getDecodedEntries(decode: AccountDecode | InstructionDecode): DecodedEntry[] {
    if (decode.kind !== IdlStandard.Codama) {
        throw new IdlError(IDL_ERROR__DECODE_KIND_MISMATCH, { expected: IdlStandard.Codama, received: decode.kind });
    }
    const { data, path } = decode.decoded;
    // the parser's path starts at the decode's own root — no separate IDL argument to mismatch
    const root = findFirstNodeFromPath(path, 'rootNode');
    const entries: DecodedEntry[] = [];

    const collect = (wrapped: NestedTypeNode<TypeNode>, value: unknown, at: readonly (number | string)[]): void => {
        // codama's own wrapper vocabulary — size/offset wrappers carry no display semantics
        const node = resolveNestedTypeNode(wrapped);
        switch (node.kind) {
            case 'definedTypeLinkNode': {
                const defined = findDefinedType(root, node.name);
                // an unresolvable link stays a leaf — the disagreement surfaces instead of vanishing
                if (!defined) return void entries.push({ node, path: at, value });
                return collect(defined, value, at);
            }
            case 'optionTypeNode':
            case 'remainderOptionTypeNode':
            case 'zeroableOptionTypeNode':
                if (isSomeOption(value)) return collect(node.item, value.value, at);
                return void entries.push({ node, path: at, value: undefined });
            case 'structTypeNode':
                for (const field of node.fields) collect(field.type, memberOf(value, field.name), [...at, field.name]);
                return;
            case 'arrayTypeNode':
            case 'setTypeNode':
                // a non-array value contradicts the schema — keep it as a leaf rather than dropping it
                if (!Array.isArray(value)) return void entries.push({ node, path: at, value });
                value.forEach((item, index) => collect(node.item, item, [...at, index]));
                return;
            case 'tupleTypeNode':
                node.items.forEach((item, index) => collect(item, memberOf(value, index), [...at, index]));
                return;
            case 'mapTypeNode':
                if (typeof value !== 'object' || value === null) return void entries.push({ node, path: at, value });
                for (const [key, item] of Object.entries(value)) collect(node.value, item, [...at, key]);
                return;
            default:
                // scalars, bytes, pubkeys, semantic wrappers, and enums (scalar index or data-variant object)
                entries.push({ node, path: at, value });
        }
    };

    // narrow the envelope union first — TS cannot correlate path/node pairs across it (same as unwrap)
    if ('accounts' in decode.decoded) {
        const instruction = getLastNodeFromPath(decode.decoded.path);
        for (const argument of instruction.arguments)
            collect(argument.type, memberOf(data, argument.name), [argument.name]);
    } else {
        const account = getLastNodeFromPath(decode.decoded.path);
        collect(account.data, data, []);
    }
    return entries;
}

/** A leaf's key — the dot form (`'chainId.id'`) or raw segments (`['signers', 0]`). */
export type EntryPath = string | readonly (number | string)[];

/** A {@link DecodedEntry} whose node is narrowed to one kind — what {@link findEntryOfKind} focuses. */
export type DecodedEntryOf<K extends TypeNode['kind']> = Omit<DecodedEntry, 'node'> & {
    node: Extract<TypeNode, { kind: K }>;
};

/** The dot-form key of a leaf (`['chainId', 'id']` → `'chainId.id'`) — the spelling {@link findEntry} accepts; maps point-free: `entries.map(joinPath)`. */
export function joinPath(entry: DecodedEntry | EntryPath): string {
    if (typeof entry === 'string') return entry;
    return ('node' in entry ? entry.path : entry).join('.');
}

/** Focus one leaf by its path — a miss is `undefined`, never a throw. */
export function findEntry(entries: readonly DecodedEntry[], path: EntryPath): DecodedEntry | undefined {
    const key = joinPath(path);
    return entries.find(entry => joinPath(entry) === key);
}

/** {@link findEntry} narrowed to one node kind — kind-specific fields read typed; a path miss or kind mismatch is `undefined`. */
export function findEntryOfKind<K extends TypeNode['kind']>(
    entries: readonly DecodedEntry[],
    path: EntryPath,
    kind: K,
): DecodedEntryOf<K> | undefined {
    const entry = findEntry(entries, path);
    if (!entry || entry.node.kind !== kind) return undefined;
    // eslint-disable-next-line typescript/consistent-type-assertions -- the kind check above is the narrowing; TS cannot correlate the checked kind with the generic K
    return entry as DecodedEntryOf<K>;
}

/**
 * The IDL's label for an enum entry's decoded value — a scalar enum's index looked up in the node,
 * a data enum's `__kind` passed through. `undefined` off the enum kind or out of range — a
 * schema/value disagreement stays visible, never a throw.
 *
 * @example
 * ```ts
 * getEnumVariantName(findEntry(entries, 'mode')) // 'burning' — decoded index 1, named by the schema
 * ```
 */
export function getEnumVariantName(entry: DecodedEntry | undefined): string | undefined {
    if (entry?.node.kind !== 'enumTypeNode') return undefined;
    // eslint-disable-next-line no-underscore-dangle -- kit's own data-enum discriminant
    if (isDataEnumValue(entry.value)) return entry.value.__kind;
    const variant = entry.node.variants[Number(entry.value)];
    return variant ? String(variant.name) : undefined;
}

function isDataEnumValue(value: unknown): value is { __kind: string } {
    // eslint-disable-next-line no-underscore-dangle -- kit's own data-enum discriminant
    return typeof value === 'object' && value !== null && '__kind' in value && typeof value.__kind === 'string';
}

function findDefinedType(root: RootNode | undefined, name: string): TypeNode | undefined {
    return root?.program.definedTypes.find(definedType => definedType.name === name)?.type;
}

function isSomeOption(value: unknown): value is { __option: 'Some'; value: unknown } {
    // eslint-disable-next-line no-underscore-dangle -- kit's own Option discriminant
    return typeof value === 'object' && value !== null && '__option' in value && value.__option === 'Some';
}

function memberOf(value: unknown, key: number | string): unknown {
    // eslint-disable-next-line typescript/consistent-type-assertions -- dynamically decoded payload; the schema names the members read off it
    return typeof value === 'object' && value !== null ? (value as Record<number | string, unknown>)[key] : undefined;
}
