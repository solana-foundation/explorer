import { isAddress } from '@solana/kit';

import type { FieldValue } from './fields';

export type InstructionArg =
    | { kind: 'leaf'; name: string; type: string; value: FieldValue }
    | { kind: 'group'; name: string; type: string; children: readonly [InstructionArg, ...InstructionArg[]] }
    | { kind: 'empty'; name: string; type: string };

export function parseCodamaArgs(data: unknown): readonly InstructionArg[] {
    if (data === undefined) {
        return [];
    }
    if (!isStruct(data)) {
        return [parseArg('data', data)];
    }
    return parseFields(data).filter(arg => arg.name !== 'discriminator');
}

const TAG_KEYS = new Set(['__discriminator', '__kind', '__option']);

function parseFields(struct: Record<string, unknown>): InstructionArg[] {
    return Object.entries(struct)
        .filter(([name]) => !TAG_KEYS.has(name))
        .map(([name, value]) => parseArg(name, value));
}

function parseArg(name: string, value: unknown): InstructionArg {
    if (Array.isArray(value) || value instanceof Uint8Array) {
        return parseItems({ items: Array.from(value), name, type: `Array[${value.length}]` });
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
        return group({ children, name, type: groupType(value) });
    }
    if (typeof value === 'string') {
        return isAddress(value)
            ? { kind: 'leaf', name, type: 'pubkey', value: { address: value, kind: 'address' } }
            : { kind: 'leaf', name, type: 'string', value: { kind: 'string', value } };
    }
    return { kind: 'leaf', name, type: scalarType(value), value: { kind: 'text', value: String(value) } };
}

function parseItems({ name, type, items }: { name: string; type: string; items: unknown[] }): InstructionArg {
    const children = items.map((item, i) => parseArg(`#${i}`, item));
    return group({ children, name, type });
}

function group({ name, type, children }: { name: string; type: string; children: InstructionArg[] }): InstructionArg {
    const [first, ...rest] = children;
    return first ? { children: [first, ...rest], kind: 'group', name, type } : { kind: 'empty', name, type };
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

function scalarType(value: unknown): string {
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
