import { describe, expect, it } from 'vitest';

import { DEPRECATED_SERUM_PROGRAM_IDS, OPEN_BOOK_PROGRAM_ID, SERUM_DECODED_MAX, SERUM_PROGRAM_IDS } from '../config';

describe('OPEN_BOOK_PROGRAM_ID', () => {
    it('is the canonical OpenBook program id', () => {
        expect(OPEN_BOOK_PROGRAM_ID).toBe('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX');
    });
});

describe('SERUM_PROGRAM_IDS', () => {
    it('contains the three known program ids', () => {
        expect(SERUM_PROGRAM_IDS).toEqual([
            '4ckmDgGdxQoPDLUkDT3vHgSAkzA3QRdNq5ywwY4sUSJn',
            '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
            OPEN_BOOK_PROGRAM_ID,
        ]);
    });

    it('includes OPEN_BOOK_PROGRAM_ID', () => {
        expect(SERUM_PROGRAM_IDS).toContain(OPEN_BOOK_PROGRAM_ID);
    });
});

describe('DEPRECATED_SERUM_PROGRAM_IDS', () => {
    it('should list every serum program id except OpenBook', () => {
        expect(DEPRECATED_SERUM_PROGRAM_IDS).toEqual([
            '4ckmDgGdxQoPDLUkDT3vHgSAkzA3QRdNq5ywwY4sUSJn',
            '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
        ]);
    });

    it('should exclude OPEN_BOOK_PROGRAM_ID', () => {
        expect(DEPRECATED_SERUM_PROGRAM_IDS).not.toContain(OPEN_BOOK_PROGRAM_ID);
    });
});

describe('SERUM_DECODED_MAX', () => {
    it('is 6', () => {
        expect(SERUM_DECODED_MAX).toBe(6);
    });
});
