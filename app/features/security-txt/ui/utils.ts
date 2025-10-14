export function securityTxtDataToBase64(data: Record<string, unknown>) {
    return Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
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
