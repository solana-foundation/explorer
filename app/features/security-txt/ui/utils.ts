import { fromUtf8, toBase64 } from '@/app/shared/lib/bytes';

export function securityTxtDataToBase64(data: Record<string, unknown>) {
    return toBase64(fromUtf8(JSON.stringify(data, null, 2)));
}

export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

export function isValidLink(value: unknown) {
    if (typeof value !== 'string') {
        return false;
    }
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol);
    } catch {
        return false;
    }
}

export function tryParseContactString(str: string) {
    const idx = str.indexOf(':');
    if (idx < 0) {
        return str;
    }
    try {
        return [str.slice(0, idx), str.slice(idx + 1)];
    } catch {
        return str;
    }
}

const CONTACT_TYPES = new Set(['discord', 'email', 'link', 'other', 'telegram', 'twitter']);

export type ContactEntry = { info: string; kind: 'contact'; type: string } | { kind: 'text'; value: string };

export function parseContactList(value: string): ContactEntry[] {
    const parts = value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    return parts.map(part => {
        const result = tryParseContactString(part);
        if (Array.isArray(result) && CONTACT_TYPES.has(result[0].toLowerCase())) {
            return { info: result[1], kind: 'contact' as const, type: result[0] };
        }
        return { kind: 'text' as const, value: part };
    });
}

export function parseCodeValue(value: unknown): string {
    if (isString(value)) {
        return value.trim();
    }
    try {
        return JSON.stringify(value, undefined, 2);
    } catch {
        return String(value);
    }
}
