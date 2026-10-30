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

export function parseCodamaArgs(data: unknown, declaredTypes?: ReadonlyMap<string, string>): readonly InstructionArg[] {
    if (data === undefined) {
        return [];
    }
    if (!isStruct(data)) {
        return [withDeclaredType(parseArg('data', data), declaredTypes)];
    }
    return parseFields(data)
        .filter(arg => arg.name !== 'discriminator')
        .map(arg => withDeclaredType(arg, declaredTypes));
}

function withDeclaredType(arg: InstructionArg, declaredTypes?: ReadonlyMap<string, string>): InstructionArg {
    const declared = declaredTypes?.get(arg.name);
    return declared ? { ...arg, type: declared } : arg;
}

const TAG_KEYS = new Set(['__discriminator', '__kind', '__option']);

function parseFields(struct: Record<string, unknown>): InstructionArg[] {
    return Object.entries(struct)
        .filter(([name]) => !TAG_KEYS.has(name))
        .map(([name, value]) => parseArg(name, value));
}

function parseArg(name: string, value: unknown): InstructionArg {
    if (Array.isArray(value) || value instanceof Uint8Array) {
        return parseItems({ items: Array.from(value), name, type: argType(value) });
    }
    if (value instanceof Map) {
        const entries = Array.from(value, ([key, item]) => ({ key, value: item }));
        return parseItems({ items: entries, name, type: `Map[${value.size}]` });
    }
    if (isStruct(value)) {
        const children = parseFields(value);
        // An enum variant without a payload is a plain value.
        if (typeof value.__kind === 'string' && children.length === 0) {
            return { kind: 'leaf', name, type: 'enum', value: { kind: 'text', value: value.__kind } };
        }
        const variant = typeof value.__kind === 'string' ? value.__kind : undefined;
        return group({ children, name, type: groupType(value), variant });
    }
    if (typeof value === 'string') {
        return isAddress(value)
            ? { kind: 'leaf', name, type: argType(value), value: { address: value, kind: 'address' } }
            : { kind: 'leaf', name, type: argType(value), value: { kind: 'string', value } };
    }
    return { kind: 'leaf', name, type: argType(value), value: { kind: 'text', value: String(value) } };
}

function parseItems({ name, type, items }: { name: string; type: string; items: unknown[] }): InstructionArg {
    const children = items.map((item, i) => parseArg(`#${i}`, item));
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
