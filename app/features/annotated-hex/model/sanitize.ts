export const MAX_DISPLAY_STRING = 256;

// C0 (U+0000-U+001F + U+007F) and C1 (U+0080-U+009F) control characters.
// Built via RegExp constructor so the source file contains no literal control bytes.
const CONTROL_CHARS = new RegExp('[\\u0000-\\u001F\\u007F-\\u009F]', 'g');
// Bidi override / isolate characters: U+202A-U+202E (LRE..RLO), U+2066-U+2069 (LRI..PDI).
const BIDI_OVERRIDES = new RegExp('[\\u202A-\\u202E\\u2066-\\u2069]', 'g');

const REPLACEMENT_CHAR = '�';

/**
 * Sanitize a UTF-8 string for display inside a tooltip.
 *
 * - Replaces C0/C1 control characters with U+FFFD (prevents terminal/screen-reader
 *   confusion from stray NULs, BEL, ESC, etc.).
 * - Replaces bidi override characters with U+FFFD (prevents RTL spoofing where a
 *   Token-2022 metadata name could render one way to the eye and another to the
 *   underlying byte stream).
 * - Truncates to MAX_DISPLAY_STRING chars with an ellipsis suffix.
 *
 * Never throws. The returned string is safe to render as React text children;
 * React will additionally HTML-escape any remaining special chars.
 */
export function sanitizeDisplayString(value: string): string {
    const cleaned = value.replace(CONTROL_CHARS, REPLACEMENT_CHAR).replace(BIDI_OVERRIDES, REPLACEMENT_CHAR);
    if (cleaned.length <= MAX_DISPLAY_STRING) return cleaned;
    return cleaned.slice(0, MAX_DISPLAY_STRING) + '…';
}
