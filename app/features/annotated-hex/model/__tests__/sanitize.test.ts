import { describe, expect, it } from 'vitest';

import { MAX_DISPLAY_STRING, sanitizeDisplayString } from '../sanitize';

const NUL = String.fromCodePoint(0x00);
const BEL = String.fromCodePoint(0x07);
const ESC = String.fromCodePoint(0x1b);
const DEL = String.fromCodePoint(0x7f);
const C1_STAR = String.fromCodePoint(0x85);
const LRE = String.fromCodePoint(0x202a);
const RLE = String.fromCodePoint(0x202b);
const PDF = String.fromCodePoint(0x202c);
const LRO = String.fromCodePoint(0x202d);
const RLO = String.fromCodePoint(0x202e);
const LRI = String.fromCodePoint(0x2066);
const RLI = String.fromCodePoint(0x2067);
const FSI = String.fromCodePoint(0x2068);
const PDI = String.fromCodePoint(0x2069);
const REPLACEMENT = String.fromCodePoint(0xfffd);

describe('sanitizeDisplayString', () => {
    it('leaves clean ASCII alone', () => {
        expect(sanitizeDisplayString('Hello World')).toBe('Hello World');
    });

    it('leaves common unicode (letters, emoji) alone', () => {
        expect(sanitizeDisplayString('Café 日本語 🎉')).toBe('Café 日本語 🎉');
    });

    it('strips C0 control characters (NUL, BEL, ESC, DEL)', () => {
        const input = `A${NUL}B${BEL}C${ESC}D${DEL}E`;
        const expected = `A${REPLACEMENT}B${REPLACEMENT}C${REPLACEMENT}D${REPLACEMENT}E`;
        expect(sanitizeDisplayString(input)).toBe(expected);
    });

    it('strips C1 control characters', () => {
        expect(sanitizeDisplayString(`X${C1_STAR}Y`)).toBe(`X${REPLACEMENT}Y`);
    });

    it('strips bidi override characters to prevent RTL spoofing', () => {
        // U+202E (RLO) is the classic spoofing char — makes "nuhtypRealName" display as "emaNlaeRpython"
        const input = `${RLO}nuhtypRealName`;
        const out = sanitizeDisplayString(input);
        expect(out).not.toContain(RLO);
        expect(out.startsWith(REPLACEMENT)).toBe(true);
    });

    it('strips all bidi override + isolate chars (U+202A-U+202E, U+2066-U+2069)', () => {
        const all = [LRE, RLE, PDF, LRO, RLO, LRI, RLI, FSI, PDI];
        for (const c of all) {
            expect(sanitizeDisplayString(c)).toBe(REPLACEMENT);
        }
    });

    it('truncates strings longer than MAX_DISPLAY_STRING with an ellipsis', () => {
        const long = 'a'.repeat(MAX_DISPLAY_STRING + 50);
        const out = sanitizeDisplayString(long);
        expect(out.length).toBe(MAX_DISPLAY_STRING + 1); // +1 for the ellipsis char
        expect(out.endsWith('…')).toBe(true);
    });

    it('does not truncate strings at exactly MAX_DISPLAY_STRING', () => {
        const exact = 'a'.repeat(MAX_DISPLAY_STRING);
        expect(sanitizeDisplayString(exact)).toBe(exact);
    });

    it('does not interpret javascript: URIs as anything special — just a string', () => {
        expect(sanitizeDisplayString('javascript:alert(1)')).toBe('javascript:alert(1)');
    });

    it('does not interpret data: URIs as anything special', () => {
        expect(sanitizeDisplayString('data:text/html,<script>alert(1)</script>')).toBe(
            'data:text/html,<script>alert(1)</script>',
        );
    });

    it('preserves printable ASCII including angle brackets and quotes (React will auto-escape)', () => {
        const input = `<script>alert("xss")</script>`;
        expect(sanitizeDisplayString(input)).toBe(input);
    });
});
