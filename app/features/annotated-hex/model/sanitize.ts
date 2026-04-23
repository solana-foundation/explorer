export const MAX_DISPLAY_STRING = 256;

const REPLACEMENT_CHAR = '�';

// Replace C0/C1 controls and bidi overrides (which can spoof display order) with U+FFFD,
// then truncate. Safe to render as React text children.
export function sanitizeDisplayString(value: string): string {
    const chars: string[] = [];
    for (const ch of value) {
        const code = ch.codePointAt(0) ?? 0;
        chars.push(isControlChar(code) || isBidiOverride(code) ? REPLACEMENT_CHAR : ch);
    }
    const cleaned = chars.join('');
    return cleaned.length <= MAX_DISPLAY_STRING ? cleaned : cleaned.slice(0, MAX_DISPLAY_STRING) + '…';
}

function isControlChar(code: number): boolean {
    return code <= 0x1f || (code >= 0x7f && code <= 0x9f);
}

function isBidiOverride(code: number): boolean {
    return (code >= 0x202a && code <= 0x202e) || (code >= 0x2066 && code <= 0x2069);
}
