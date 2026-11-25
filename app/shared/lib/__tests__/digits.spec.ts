import { describe, expect, it } from 'vitest';

import { isDigits } from '../digits';

describe('isDigits', () => {
    it.each(['0', '0123456789'])('should accept %s', text => {
        expect(isDigits(text)).toBe(true);
    });

    it.each(['', '1.2', '-1', '1e3', ' 1', '١٢٣'])('should reject %j', text => {
        expect(isDigits(text)).toBe(false);
    });
});
