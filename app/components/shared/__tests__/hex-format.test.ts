import { describe, expect, it } from 'vitest';

import { formatHexSpans, groupHexRows, splitHexPairs, truncateHexPairs } from '../HexData';

describe('splitHexPairs', () => {
    it.each([
        { expected: [], hex: '', label: 'empty string' },
        { expected: ['ab'], hex: 'ab', label: 'single byte' },
        { expected: ['ab', 'cd', 'ef'], hex: 'abcdef', label: 'three bytes' },
        { expected: ['01', '02', '03', '04'], hex: '01020304', label: 'four bytes' },
    ])('should split $label into pairs', ({ hex, expected }) => {
        expect(splitHexPairs(hex)).toEqual(expected);
    });
});

describe('truncateHexPairs', () => {
    it('should return all pairs when at threshold (16)', () => {
        const pairs = Array.from({ length: 16 }, (_, i) => i.toString(16).padStart(2, '0'));
        const result = truncateHexPairs(pairs);
        expect(result.truncated).toBe(false);
        expect(result.pairs).toEqual(pairs);
    });

    it('should truncate when above threshold', () => {
        const pairs = Array.from({ length: 20 }, (_, i) => i.toString(16).padStart(2, '0'));
        const result = truncateHexPairs(pairs);
        expect(result.truncated).toBe(true);
        expect(result.pairs).toHaveLength(17); // 8 head + ellipsis + 8 tail
        expect(result.pairs[8]).toBe('\u2026');
    });

    it('should return empty pairs unchanged', () => {
        expect(truncateHexPairs([])).toEqual({ pairs: [], truncated: false });
    });
});

describe('formatHexSpans', () => {
    it('should return empty array for no pairs', () => {
        expect(formatHexSpans([])).toEqual([]);
    });

    it('should group into a single primary span for short data', () => {
        const spans = formatHexSpans(['ab']);
        expect(spans).toEqual([{ text: 'ab', variant: 'primary' }]);
    });

    it('should alternate primary/secondary-old for spans of 4', () => {
        const pairs = ['01', '02', '03', '04', '05', '06', '07', '08'];
        const spans = formatHexSpans(pairs);
        expect(spans).toHaveLength(2);
        expect(spans[0].variant).toBe('primary');
        expect(spans[1].variant).toBe('secondary-old');
    });

    it('should join pairs within a span with spaces', () => {
        const spans = formatHexSpans(['aa', 'bb', 'cc']);
        expect(spans[0].text).toBe('aa bb cc');
    });

    it('should handle ellipsis marker as its own span', () => {
        const pairs = ['01', '02', '03', '04', '\u2026', '05', '06', '07', '08'];
        const spans = formatHexSpans(pairs);
        const ellipsis = spans.find(s => s.text === '\u2026');
        expect(ellipsis).toBeDefined();
        expect(ellipsis?.variant).toBe('secondary-old');
    });

    it('should compose with truncateHexPairs: formatHexSpans(truncateHexPairs(pairs))', () => {
        const pairs = Array.from({ length: 20 }, (_, i) => i.toString(16).padStart(2, '0'));
        const { pairs: truncated } = truncateHexPairs(pairs);
        const spans = formatHexSpans(truncated);

        // Head spans + ellipsis + tail spans
        expect(spans.some(s => s.text === '\u2026')).toBe(true);
        expect(spans[0].variant).toBe('primary');
        expect(spans[0].text).toBe('00 01 02 03');
    });
});

describe('groupHexRows', () => {
    it('should return empty array for no spans', () => {
        expect(groupHexRows([])).toEqual([]);
    });

    it('should group into rows of 4 spans', () => {
        const pairs = Array.from({ length: 17 }, (_, i) => i.toString(16).padStart(2, '0'));
        const spans = formatHexSpans(pairs);
        const rows = groupHexRows(spans);
        expect(rows).toHaveLength(2);
        expect(rows[0]).toHaveLength(4);
        expect(rows[1]).toHaveLength(1);
    });

    it('should restart alternation at each row', () => {
        const pairs = Array.from({ length: 32 }, () => 'ff');
        const spans = formatHexSpans(pairs);
        const rows = groupHexRows(spans);
        expect(rows).toHaveLength(2);
        expect(rows[0][0].variant).toBe('primary');
        expect(rows[1][0].variant).toBe('primary');
    });
});
