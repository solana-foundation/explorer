import { describe, expect, it } from 'vitest';

import { getRpc } from '../get-rpc';

describe('getRpc', () => {
    it('should return the same client for repeated calls with the same URL', () => {
        expect(getRpc('http://localhost:8899')).toBe(getRpc('http://localhost:8899'));
    });

    it('should return distinct clients for distinct URLs', () => {
        expect(getRpc('http://localhost:8899')).not.toBe(getRpc('http://localhost:8900'));
    });
});
