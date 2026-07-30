import { describe, expect, it } from 'vitest';

import { hasAddressLookupTableLayout } from '../index.js';

describe('hasAddressLookupTableLayout', () => {
    it('should return false for missing raw data', () => {
        expect(hasAddressLookupTableLayout(null)).toBe(false);
    });

    it('should return false for data shorter than the meta section', () => {
        expect(hasAddressLookupTableLayout(new Uint8Array(55))).toBe(false);
    });

    it('should return true for a meta-only table', () => {
        expect(hasAddressLookupTableLayout(new Uint8Array(56))).toBe(true);
    });

    it('should return true when addresses fill whole 32-byte slots', () => {
        expect(hasAddressLookupTableLayout(new Uint8Array(56 + 3 * 32))).toBe(true);
    });

    it('should return false when the address section is not a multiple of 32 bytes', () => {
        expect(hasAddressLookupTableLayout(new Uint8Array(56 + 31))).toBe(false);
    });
});
