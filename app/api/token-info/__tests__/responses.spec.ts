import { gen } from '@__fixtures__/gen';
import { tokenInfo } from '@entities/token-info/__fixtures__/token-info';
import { describe, expect, it } from 'vitest';

import { toTokenInfosResponse } from '../responses';

const STUB_CACHE_HEADERS = { error: { 'Cache-Control': 'error' }, resolved: { 'Cache-Control': 'resolved' } };

describe('toTokenInfosResponse', () => {
    it('should answer the tokens of a resolved lookup with the resolved cache headers', async () => {
        const token = tokenInfo(gen.address(1), true);

        const response = toTokenInfosResponse({ kind: 'resolved', tokens: [token] }, STUB_CACHE_HEADERS);

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ content: [token] });
        expect(response.headers.get('Cache-Control')).toBe('resolved');
    });

    it.each([
        { error: 'Token info rate limited', kind: 'rate-limited', status: 429 },
        { error: 'Token info unavailable', kind: 'unavailable', status: 503 },
    ] as const)(
        'should answer a $kind lookup with $status and the error cache headers',
        async ({ error, kind, status }) => {
            const response = toTokenInfosResponse({ kind }, STUB_CACHE_HEADERS);

            expect(response.status).toBe(status);
            expect(await response.json()).toEqual({ error });
            expect(response.headers.get('Cache-Control')).toBe('error');
        },
    );
});
