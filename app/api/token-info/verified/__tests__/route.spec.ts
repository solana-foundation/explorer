import { gen } from '@__fixtures__/gen';
import { tokenInfo } from '@entities/token-info/__fixtures__/token-info';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '../route';

const MINT_A = gen.address(1);
const MINT_B = gen.address(2);

const mocks = vi.hoisted(() => ({ lookupVerifiedTokenInfos: vi.fn() }));

vi.mock('@entities/token-info/server', async () => {
    const actual = await vi.importActual<typeof import('@entities/token-info/server')>('@entities/token-info/server');
    return { ...actual, lookupVerifiedTokenInfos: mocks.lookupVerifiedTokenInfos };
});

describe('POST /api/token-info/verified', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return the verified token info of the addresses without a cache header', async () => {
        mocks.lookupVerifiedTokenInfos.mockResolvedValueOnce({ kind: 'resolved', tokens: [tokenInfo(MINT_A, true)] });

        const response = await post(JSON.stringify({ addresses: [MINT_A, MINT_B] }));

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ content: [tokenInfo(MINT_A, true)] });
        expect(response.headers.get('Cache-Control')).toBeNull();
        expect(mocks.lookupVerifiedTokenInfos).toHaveBeenCalledWith({ addresses: [MINT_A, MINT_B] });
    });

    it.each([
        ['a body that is not JSON', '{'],
        ['a body without addresses', JSON.stringify({})],
        ['an entry that is not an address', JSON.stringify({ addresses: [MINT_A, 'not-a-pubkey'] })],
    ])('should return 400 without a lookup for %s', async (_, body) => {
        const response = await post(body);

        expect(response.status).toBe(400);
        expect(mocks.lookupVerifiedTokenInfos).not.toHaveBeenCalled();
    });
});

function post(body: string): Promise<Response> {
    return POST(new Request('http://localhost/api/token-info/verified', { body, method: 'POST' }));
}
