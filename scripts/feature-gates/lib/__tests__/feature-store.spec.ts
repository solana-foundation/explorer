import { escapeNonAscii } from '../feature-store';

describe('escapeNonAscii', () => {
    it('should pass pure-ASCII input through unchanged', () => {
        const json = '{"key":"value","n":1}';
        expect(escapeNonAscii(json)).toBe(json);
    });

    it('should escape common non-ASCII BMP punctuation as \\uXXXX', () => {
        // Horizontal ellipsis (U+2026), em-dash (U+2014), curly apostrophe (U+2019).
        const input = '"x… — let’s"';
        const expected = '"x\\u2026 \\u2014 let\\u2019s"';
        expect(escapeNonAscii(input)).toBe(expected);
    });

    it('should escape Latin extended characters', () => {
        const input = '"naïve façade"';
        // ï = U+00EF, ç = U+00E7
        expect(escapeNonAscii(input)).toBe('"na\\u00efve fa\\u00e7ade"');
    });

    it('should emit astral codepoints as surrogate-pair escapes, matching Python ensure_ascii=True', () => {
        // U+1F600 GRINNING FACE → UTF-16 surrogates D83D + DE00.
        const input = '"hi 😀"';
        expect(escapeNonAscii(input)).toBe('"hi \\ud83d\\ude00"');
    });

    it('should leave embedded backslash-u sequences alone (they are already ASCII)', () => {
        // A pre-escaped string from upstream must not be double-escaped.
        const input = '"already \\u2026 escaped"';
        expect(escapeNonAscii(input)).toBe(input);
    });

    it('should be a round-trip when piped through JSON.parse', () => {
        const value = {
            astral: 'rocket 🚀 fuel',
            ellipsis: 'continues…',
            latin: 'naïve',
            mixed: 'plain ASCII + ünïcödé + 😀',
        };
        const escaped = escapeNonAscii(JSON.stringify(value));
        // After escaping, every non-ASCII byte must be gone.
        // Use a Buffer scan rather than a regex so we measure raw UTF-8 bytes,
        // not the Unicode code points the regex would normalize over.
        const bytes = Buffer.from(escaped, 'utf8');
        expect(bytes.every(byte => byte < 0x80)).toBe(true);
        // And JSON.parse must reconstruct the original object verbatim.
        expect(JSON.parse(escaped)).toEqual(value);
    });
});
