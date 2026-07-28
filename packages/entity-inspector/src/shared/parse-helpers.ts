// No kit equivalent — jsonParsed payloads are `unknown` by design; these narrow without asserting.
import type { SafeNumeric } from './types.js';

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function asRecord(value: unknown): Record<string, unknown> | null {
    return isRecord(value) ? value : null;
}

export function asString(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
}

export function asSafeNumeric(value: unknown): SafeNumeric {
    if (typeof value === 'bigint') {
        const n = Number(value);
        return Number.isSafeInteger(n) ? n : String(value);
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Number.isSafeInteger(value) ? value : String(value);
    }
    return null;
}

export function asBoolean(value: unknown): boolean | null {
    return typeof value === 'boolean' ? value : null;
}
