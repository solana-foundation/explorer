import { gen } from '@__fixtures__/gen';
import { tokenInfo } from '@entities/token-info/__fixtures__/token-info';
import { describe, expect, it } from 'vitest';

import { toTokenInfosResponse } from '../responses';

describe('toTokenInfosResponse', () => {
    it('should answer the tokens of a resolved lookup', async () => {
        const token = tokenInfo(gen.address(1), true);

        const response = toTokenInfosResponse({ kind: 'resolved', tokens: [token] });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ content: [token] });
    });

    it.each([
        { error: 'Token info rate limited', kind: 'rate-limited', status: 429 },
        { error: 'Token info unavailable', kind: 'unavailable', status: 503 },
    ] as const)('should answer a $kind lookup with $status', async ({ error, kind, status }) => {
        const response = toTokenInfosResponse({ kind });

        expect(response.status).toBe(status);
        expect(await response.json()).toEqual({ error });
    });
});
