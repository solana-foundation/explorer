import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gen } from '@/app/__fixtures__/gen';

import { discoverWithJupiter } from '../discover-with-jupiter';

const MINT = gen.address();

describe('discoverWithJupiter', () => {
    beforeEach(() => {
        vi.stubEnv('JUPITER_API_KEY', 'test-key');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it.each([
        ['a string', { icon: 'https://example.com/a.png' }, 'https://example.com/a.png'],
        ['null', { icon: null }, undefined],
        ['absent', {}, undefined],
    ])('should map an icon that is %s to the logo', async (_, icon, logoUri) => {
        const entry = { decimals: 6, id: MINT, name: 'Token A', symbol: 'TKA', ...icon };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([entry])));

        const [token] = await discoverWithJupiter('TKA', new AbortController().signal);

        expect(token).toEqual({
            address: MINT,
            decimals: 6,
            isVerified: false,
            logoUri,
            name: 'Token A',
            symbol: 'TKA',
        });
    });
});
