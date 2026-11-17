import { describe, expect, it } from 'vitest';

import { getOwn } from '../object';

describe('getOwn', () => {
    it('should return the value of an own property', () => {
        const parsed: Record<string, number> = JSON.parse('{"devnet": 1, "__proto__": 2}');

        expect(getOwn(parsed, 'devnet')).toBe(1);
        expect(getOwn(parsed, '__proto__')).toBe(2);
    });

    it('should return undefined for an inherited or absent key', () => {
        const clusters: Record<string, number> = { devnet: 1 };

        expect(getOwn(clusters, 'constructor')).toBeUndefined();
        expect(getOwn(clusters, '__proto__')).toBeUndefined();
        expect(getOwn(clusters, 'testnet')).toBeUndefined();
    });
});
