import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gen } from '@/app/__fixtures__/gen';
import { Logger } from '@/app/shared/lib/logger';

import { discoverWithJupiter } from '../discover-with-jupiter';

const MINT = gen.address();

describe('discoverWithJupiter', () => {
    beforeEach(() => {
        vi.stubEnv('JUPITER_API_KEY', 'test-key');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('should map a Jupiter token to a discovered token', async () => {
        const entry = { ...jupiterToken(), icon: 'https://example.com/a.png' };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([entry])));

        const [token] = await discoverWithJupiter('TKA', new AbortController().signal);

        expect(token).toEqual({
            address: MINT,
            decimals: 6,
            isVerified: false,
            logoUri: 'https://example.com/a.png',
            name: 'Token A',
            symbol: 'TKA',
        });
    });

    it.each([
        ['a 429', Response.json({}, { status: 429 }), '[api:search] Jupiter rate limit exceeded'],
        ['a malformed entry', Response.json([jupiterToken(), { id: MINT }]), '[api:search] Jupiter schema mismatch'],
    ])('should answer no tokens with a warning for %s', async (_, response, warning) => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

        const tokens = await discoverWithJupiter('TKA', new AbortController().signal);

        expect(tokens).toEqual([]);
        expect(Logger.warn).toHaveBeenCalledWith(warning, { sentry: true });
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should log a network failure as an error', async () => {
        const error = new TypeError('fetch failed');
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));

        const tokens = await discoverWithJupiter('TKA', new AbortController().signal);

        expect(tokens).toEqual([]);
        expect(Logger.error).toHaveBeenCalledWith(error, { sentry: true });
    });

    it('should log nothing for an abort', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('This operation was aborted', 'AbortError')));

        const tokens = await discoverWithJupiter('TKA', new AbortController().signal);

        expect(tokens).toEqual([]);
        expect(Logger.warn).not.toHaveBeenCalled();
        expect(Logger.error).not.toHaveBeenCalled();
    });
});

function jupiterToken() {
    return { decimals: 6, id: MINT, name: 'Token A', symbol: 'TKA' };
}
