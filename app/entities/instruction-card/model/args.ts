import { isAddress } from '@solana/kit';

import type { FieldValue } from './fields';

export type InstructionArg =
    | { kind: 'leaf'; name: string; type: string; value: FieldValue }
    | {
          kind: 'group';
          name: string;
          type: string;
          variant?: string;
          children: readonly [InstructionArg, ...InstructionArg[]];
      }
    | { kind: 'empty'; name: string; type: string };

/** A leaf's dot-joined path (`['rewardInfos', 0, 'openTime'] → 'rewardInfos.0.openTime'`) — the key a precise-type map uses. */
type ArgPath = readonly (number | string)[];

/**
 * `types` (optional) overlays precise codama scalar-type labels (`u64`/`i32`/`PublicKey`/`bool`) onto the
 * value-inferred fallback, keyed by the dot-joined leaf path — see {@link codamaScalarTypeLabels}. Any
 * path not in the map keeps the inferred label, so callers without a decode schema are unaffected.
 */
export function parseCodamaArgs(data: unknown, types?: ReadonlyMap<string, string>): readonly InstructionArg[] {
    if (data === undefined) {
        return [];
    }
    if (!isStruct(data)) {
        return [parseArg('data', data, [], types)];
    }
    return parseFields(data, [], types).filter(arg => arg.name !== 'discriminator');
}

const TAG_KEYS = new Set(['__discriminator', '__kind', '__option']);

function parseFields(
    struct: Record<string, unknown>,
    path: ArgPath,
    types?: ReadonlyMap<string, string>,
): InstructionArg[] {
    return Object.entries(struct)
        .filter(([name]) => !TAG_KEYS.has(name))
        .map(([name, value]) => parseArg(name, value, [...path, name], types));
}

function parseArg(name: string, value: unknown, path: ArgPath, types?: ReadonlyMap<string, string>): InstructionArg {
    if (Array.isArray(value) || value instanceof Uint8Array) {
        return parseItems({ items: Array.from(value), name, path, type: argType(value) }, types);
    }
    if (value instanceof Map) {
        const entries = Array.from(value, ([key, item]) => ({ key, value: item }));
        return parseItems({ items: entries, name, path, type: `Map[${value.size}]` }, types);
    }
    if (isStruct(value)) {
        // kit's Some wrapper (`{ __option: 'Some', value }`): the decode schema unwraps the option to the
        // inner value at the option's own path (see getDecodedEntries). Keep the option transparent to the
        // type overlay — render the value child but let it inherit `path`, not `[...path, 'value']`, so its
        // nested leaves still match the schema map (otherwise e.g. an `option(u64)` falls back to `bignum`).
        if (value.__option === 'Some' && 'value' in value) {
            return group({ children: [parseArg('value', value.value, path, types)], name, type: groupType(value) });
        }
        const children = parseFields(value, path, types);
        // An enum variant without a payload is a plain value.
        if (typeof value.__kind === 'string' && children.length === 0) {
            return { kind: 'leaf', name, type: 'enum', value: { kind: 'text', value: value.__kind } };
        }
        const variant = typeof value.__kind === 'string' ? value.__kind : undefined;
        return group({ children, name, type: groupType(value), variant });
    }
    if (typeof value === 'string') {
        return isAddress(value)
            ? { kind: 'leaf', name, type: scalarType(path, value, types), value: { address: value, kind: 'address' } }
            : { kind: 'leaf', name, type: scalarType(path, value, types), value: { kind: 'string', value } };
    }
    return { kind: 'leaf', name, type: scalarType(path, value, types), value: { kind: 'text', value: String(value) } };
}

/** The precise label from the decode schema when present, else the value-inferred fallback. */
function scalarType(path: ArgPath, value: unknown, types?: ReadonlyMap<string, string>): string {
    return types?.get(path.join('.')) ?? argType(value);
}

function parseItems(
    { name, type, items, path }: { name: string; type: string; items: unknown[]; path: ArgPath },
    types?: ReadonlyMap<string, string>,
): InstructionArg {
    const children = items.map((item, i) => parseArg(`#${i}`, item, [...path, i], types));
    return group({ children, name, type });
}

function group({
    name,
    type,
    children,
    variant,
}: {
    name: string;
    type: string;
    children: InstructionArg[];
    variant?: string;
}): InstructionArg {
    const [first, ...rest] = children;
    if (!first) return { kind: 'empty', name, type };
    return { children: [first, ...rest], kind: 'group', name, type, ...(variant ? { variant } : {}) };
}

function groupType(value: Record<string, unknown>): string {
    if (value.__kind) {
        return String(value.__kind);
    }
    if (value.__option) {
        return `Option(${String(value.__option)})`;
    }
    return 'object';
}

/** The Type column of a list or a scalar. */
export function argType(value: unknown): string {
    if (Array.isArray(value) || value instanceof Uint8Array) {
        return `Array[${value.length}]`;
    }
    if (typeof value === 'string') {
        return isAddress(value) ? 'pubkey' : 'string';
    }
    if (value === null) {
        return 'null';
    }
    return typeof value === 'bigint' ? 'bignum' : typeof value;
}

function isStruct(value: unknown): value is Record<string, unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        !(value instanceof Uint8Array) &&
        !(value instanceof Map)
    );
}
