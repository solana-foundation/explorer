export const MAX_DISPLAY_STRING = 256;

const REPLACEMENT_CHAR = '�';

/**
 * Sanitize a UTF-8 string for display inside a tooltip.
 *
 * - Replaces C0/C1 control characters with U+FFFD (prevents terminal/screen-reader
 *   confusion from stray NULs, BEL, ESC, etc.).
 * - Replaces bidi override / isolate characters with U+FFFD (prevents RTL spoofing
 *   where a Token-2022 metadata name could render one way to the eye and another
 *   to the underlying byte stream).
 * - Truncates to MAX_DISPLAY_STRING chars with an ellipsis suffix.
 *
 * Implemented via charCode scan (not regex) to satisfy the repo's no-regex lint
 * convention and to keep zero dependencies.
 *
 * Never throws. The returned string is safe to render as React text children;
 * React will additionally HTML-escape any remaining special chars.
 */
export function sanitizeDisplayString(value: string): string {
    const chars: string[] = [];
    for (const ch of value) {
        const code = ch.codePointAt(0) ?? 0;
        if (isControlChar(code) || isBidiOverride(code)) {
            chars.push(REPLACEMENT_CHAR);
        } else {
            chars.push(ch);
        }
    }
    const cleaned = chars.join('');
    if (cleaned.length <= MAX_DISPLAY_STRING) return cleaned;
    return cleaned.slice(0, MAX_DISPLAY_STRING) + '…';
}

function isControlChar(code: number): boolean {
    // C0: U+0000..U+001F, DEL: U+007F, C1: U+0080..U+009F
    return code <= 0x1f || (code >= 0x7f && code <= 0x9f);
}

function isBidiOverride(code: number): boolean {
    // U+202A..U+202E (LRE, RLE, PDF, LRO, RLO), U+2066..U+2069 (LRI, RLI, FSI, PDI)
    return (code >= 0x202a && code <= 0x202e) || (code >= 0x2066 && code <= 0x2069);
}
