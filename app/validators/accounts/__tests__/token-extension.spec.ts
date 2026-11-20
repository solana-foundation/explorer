import { TokenExtension } from '@validators/accounts/token-extension';
import { create } from 'superstruct';
import { describe, expect, it } from 'vitest';

describe('TokenExtension', () => {
    it('should parse an unknown extension name as unparseableExtension', () => {
        const state = { authority: '8PQ2dDQcE6pLKaFU4ToTcZ7bcBFWrL3uKfcwcg8UJZNB' };

        expect(create({ extension: 'futureExtension', state }, TokenExtension)).toEqual({
            extension: 'unparseableExtension',
            state,
        });
    });
});
