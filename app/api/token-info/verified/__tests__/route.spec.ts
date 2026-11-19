import { gen } from '@__fixtures__/gen';
import { resolved, tokenInfo } from '@entities/token-info/__fixtures__/token-info';
import { JUPITER_ROUTE_TIMEOUT_MS } from '@entities/token-info/api/lookup-token-info';
import { lookupVerifiedTokenInfos } from '@entities/token-info/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { maxDuration, POST } from '../route';

const MINT_A = gen.address(1);
const MINT_B = gen.address(2);

vi.mock('@entities/token-info/server', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/token-info/server')>()),
    lookupVerifiedTokenInfos: vi.fn(),
}));

afterEach(() => {
    vi.clearAllMocks();
});

describe('POST /api/token-info/verified', () => {
    it('should return the verified token info of the addresses without a cache header', async () => {
        vi.mocked(lookupVerifiedTokenInfos).mockResolvedValue(resolved(tokenInfo(MINT_A, true)));

        const response = await post(JSON.stringify({ addresses: [MINT_A, MINT_B] }));

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ content: [tokenInfo(MINT_A, true)] });
        expect(response.headers.get('Cache-Control')).toBeNull();
        expect(lookupVerifiedTokenInfos).toHaveBeenCalledWith({ addresses: [MINT_A, MINT_B] });
    });

    it.each([
        ['a body that is not JSON', '{'],
        ['a body without addresses', JSON.stringify({})],
        ['an entry that is not an address', JSON.stringify({ addresses: [MINT_A, 'not-a-pubkey'] })],
    ])('should return 400 without a lookup for %s', async (_, body) => {
        const response = await post(body);

        expect(response.status).toBe(400);
        expect(lookupVerifiedTokenInfos).not.toHaveBeenCalled();
    });

    it('should keep the function duration under the browser timeout', () => {
        expect(maxDuration * 1000).toBeLessThan(JUPITER_ROUTE_TIMEOUT_MS);
    });
});

function post(body: string): Promise<Response> {
    return POST(new Request('http://localhost/api/token-info/verified', { body, method: 'POST' }));
}
