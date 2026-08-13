import { describe, expect, it } from 'vitest';

import { getRpc } from '../get-rpc';

describe('getRpc', () => {
    it('should return the same client for repeated calls with the same URL', () => {
        expect(getRpc('http://localhost:8899')).toBe(getRpc('http://localhost:8899'));
    });

    it('should return distinct clients for distinct URLs', () => {
        expect(getRpc('http://localhost:8899')).not.toBe(getRpc('http://localhost:8900'));
    });

    it('should evict the least recently used client once the cache is full', () => {
        const first = getRpc('http://first.example');
        for (let i = 0; i < 30; i++) {
            getRpc(`http://filler-${i}.example`);
        }
        expect(getRpc('http://first.example')).not.toBe(first);
    });

    it('should keep a recently used client through evictions', () => {
        const first = getRpc('http://kept.example');
        for (let i = 0; i < 30; i++) {
            getRpc(`http://churn-${i}.example`);
            getRpc('http://kept.example');
        }
        expect(getRpc('http://kept.example')).toBe(first);
    });
});
