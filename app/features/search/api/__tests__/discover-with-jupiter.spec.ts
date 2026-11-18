import { JupiterHttpError } from '@entities/token-info/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { discoverWithJupiter } from '../discover-with-jupiter';

const mocks = vi.hoisted(() => ({ searchJupiterTokens: vi.fn() }));

vi.mock('@entities/token-info/server', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/token-info/server')>()),
    searchJupiterTokens: mocks.searchJupiterTokens,
}));

describe('discoverWithJupiter', () => {
    beforeEach(() => {
        vi.stubEnv('JUPITER_API_KEY', 'test-key');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.clearAllMocks();
        mocks.searchJupiterTokens.mockReset();
    });

    it.each([
        ['a rate limit', { kind: 'rate-limited' }, '[api:search] Jupiter rate limit exceeded'],
        [
            'a transient failure',
            { error: new JupiterHttpError({ status: 503, statusText: 'Service Unavailable' }), kind: 'unavailable' },
            '[api:search] Jupiter discovery failed',
        ],
        [
            'a query that the Jupiter firewall refuses',
            { error: new JupiterHttpError({ status: 403, statusText: 'Forbidden' }), kind: 'unavailable' },
            '[api:search] Jupiter returned 403',
        ],
    ])('should return no tokens with a warning for %s', async (_, search, warning) => {
        mocks.searchJupiterTokens.mockResolvedValueOnce(search);

        const tokens = await discoverWithJupiter('TKA', new AbortController().signal);

        expect(tokens).toEqual([]);
        expect(Logger.warn).toHaveBeenCalledWith(warning, expect.objectContaining({ sentry: true }));
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should log nothing for an abort', async () => {
        mocks.searchJupiterTokens.mockResolvedValueOnce({
            error: new DOMException('This operation was aborted', 'AbortError'),
            kind: 'unavailable',
        });

        const tokens = await discoverWithJupiter('TKA', new AbortController().signal);

        expect(tokens).toEqual([]);
        expect(Logger.warn).not.toHaveBeenCalled();
        expect(Logger.error).not.toHaveBeenCalled();
    });
});
