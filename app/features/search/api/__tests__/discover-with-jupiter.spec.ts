import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { discoverWithJupiter } from '../discover-with-jupiter';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('JUPITER_API_KEY', 'test-key');
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
});

describe('discoverWithJupiter', () => {
    it.each([
        ['a warning', 'a rate limit', 429, Logger.warn],
        ['a warning', 'a transient failure', 503, Logger.warn],
        ['a warning', 'a query that the Jupiter firewall refuses', 403, Logger.warn],
        ['an error', 'a rejected API key', 401, Logger.error],
    ])('should return no tokens and report %s for %s', async (_, __, status, report) => {
        fetchMock.mockResolvedValue(new Response(null, { status }));

        expect(await discover()).toEqual([]);
        expect(report).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ sentry: true }));
    });

    it('should return no tokens and report nothing for an aborted request', async () => {
        fetchMock.mockRejectedValue(new DOMException('This operation was aborted', 'AbortError'));

        expect(await discover()).toEqual([]);
        expect(Logger.warn).not.toHaveBeenCalled();
        expect(Logger.error).not.toHaveBeenCalled();
    });
});

function discover(): ReturnType<typeof discoverWithJupiter> {
    return discoverWithJupiter('TKA', new AbortController().signal);
}
