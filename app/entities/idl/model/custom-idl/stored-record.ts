import { enums, is, literal, string, type, union, unknown } from 'superstruct';

import { parseCustomIdl } from './parse-custom-idl';
import { type CustomIdlRecord, type IdlSelection } from './types';

export type StoredRecordParse =
    | { kind: 'record'; record: CustomIdlRecord }
    | { kind: 'unreadable'; programAddress: string }
    | { kind: 'check-failed' };

export function serializeRecord({ customIdl, origin, selected }: CustomIdlRecord): string {
    return JSON.stringify({ idl: customIdl.idl, origin, selected });
}

// A user can edit the storage by hand, so a read runs the same parser as an upload.
export async function parseStoredRecord(programAddress: string, value: unknown): Promise<StoredRecordParse> {
    const stored = parseJson(value);
    if (!is(stored, StoredRecord)) return { kind: 'unreadable', programAddress };

    const parsed = await parseCustomIdl(stored.idl, programAddress);
    if (parsed.ok) {
        return {
            kind: 'record',
            record: { customIdl: parsed.customIdl, origin: stored.origin, selected: stored.selected },
        };
    }
    return parsed.error.kind === 'check-failed' ? { kind: 'check-failed' } : { kind: 'unreadable', programAddress };
}

/** Returns `undefined` when the stored value is not a record or already has this selection. */
export function withSelection(value: unknown, selected: IdlSelection): string | undefined {
    const stored = parseJson(value);
    return is(stored, StoredRecord) && stored.selected !== selected
        ? JSON.stringify({ ...stored, selected })
        : undefined;
}

const StoredRecord = type({
    idl: unknown(),
    origin: union([type({ fileName: string(), kind: literal('file') }), type({ kind: literal('pasted') })]),
    selected: enums<IdlSelection>(['custom', 'onChain']),
});

function parseJson(value: unknown): unknown {
    if (typeof value !== 'string') return undefined;
    try {
        return JSON.parse(value);
    } catch {
        return undefined;
    }
}
