import { gen } from '@__fixtures__/gen';
import { address } from '@solana/kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { GET } from '../route';

const { isStakeAccountMock } = vi.hoisted(() => ({ isStakeAccountMock: vi.fn() }));

vi.mock('@entities/stake-rewards/server', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/stake-rewards/server')>()),
    isStakeAccount: isStakeAccountMock,
}));

const VALID_ADDRESS = address(gen.address(0));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('GET /api/stake-rewards/[address]', () => {
    beforeEach(() => {
        vi.stubEnv('NEXT_PUBLIC_STAKE_TOTAL_REWARD_ENABLED', 'true');
        vi.stubEnv('SOLSCAN_API_KEY', 'test-key');
        isStakeAccountMock.mockResolvedValue(true);
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.clearAllMocks();
    });

    it('should return the summed total in lamports', async () => {
        mockPage([
            { amount: 1_000, decimals: 9, epoch: 900 },
            { amount: 2_000, decimals: 9, epoch: 901 },
        ]);

        const response = await callRoute(VALID_ADDRESS);

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ totalReward: 3_000 });
    });

    it('should reach Solscan once for an account whose history fits one page', async () => {
        mockPage([{ amount: 1, decimals: 9, epoch: 900 }]);

        await callRoute(VALID_ADDRESS);

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should cache a successful response at the CDN', async () => {
        mockPage([{ amount: 1, decimals: 9, epoch: 900 }]);

        const response = await callRoute(VALID_ADDRESS);

        expect(response.headers.get('Cache-Control')).toContain('s-maxage=14400');
    });

    it('should refuse every request when the feature is disabled', async () => {
        vi.stubEnv('NEXT_PUBLIC_STAKE_TOTAL_REWARD_ENABLED', 'false');

        const response = await callRoute(VALID_ADDRESS);

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'Stake rewards are not enabled' });
        expect(isStakeAccountMock).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should reject an invalid address without calling Solscan', async () => {
        const response = await callRoute('not-an-address');

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'Invalid address' });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should refuse clusters Solscan does not index', async () => {
        const response = await callRoute(VALID_ADDRESS, '?cluster=devnet');

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'Stake rewards are only available on mainnet' });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should default to mainnet when no cluster is given', async () => {
        mockPage([{ amount: 1, decimals: 9, epoch: 900 }]);

        const response = await callRoute(VALID_ADDRESS);

        expect(response.status).toBe(200);
    });

    it('should return 503 when the key is not configured', async () => {
        vi.stubEnv('SOLSCAN_API_KEY', '');

        const response = await callRoute(VALID_ADDRESS);

        expect(response.status).toBe(503);
        expect(await response.json()).toEqual({ error: 'Stake rewards are not configured' });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should refuse an address that is not a stake account without spending upstream quota', async () => {
        isStakeAccountMock.mockResolvedValue(false);

        const response = await callRoute(VALID_ADDRESS);

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'Not a stake account' });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should not spend upstream quota when the stake-account check fails', async () => {
        isStakeAccountMock.mockRejectedValue(new Error('rpc down'));

        const response = await callRoute(VALID_ADDRESS);

        expect(response.status).toBe(502);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should pass a rate limit through as 429', async () => {
        fetchMock.mockResolvedValueOnce({ json: async () => ({}), ok: false, status: 429 });

        const response = await callRoute(VALID_ADDRESS);

        expect(response.status).toBe(429);
        expect(await response.json()).toEqual({ error: 'Rate limit exceeded' });
    });

    it('should return 502 when the key lacks a plan', async () => {
        fetchMock.mockResolvedValueOnce({ json: async () => ({}), ok: false, status: 401 });

        const response = await callRoute(VALID_ADDRESS);

        expect(response.status).toBe(502);
        expect(await response.json()).toEqual({ error: 'Failed to fetch stake rewards' });
    });

    it('should return 502 when Solscan returns an unexpected shape', async () => {
        fetchMock.mockResolvedValueOnce({
            json: async () => ({ data: [{ amount: 1, decimals: 2, epoch: 900 }], success: true }),
            ok: true,
            status: 200,
        });

        const response = await callRoute(VALID_ADDRESS);

        expect(response.status).toBe(502);
        expect(await response.json()).toEqual({ error: 'Failed to fetch stake rewards' });
    });

    it('should tag a rejected key apart from other upstream failures', async () => {
        const logged = vi.spyOn(Logger, 'error').mockImplementation(() => {});
        fetchMock.mockResolvedValueOnce({ json: async () => ({}), ok: false, status: 401 });

        await callRoute(VALID_ADDRESS);

        expect(logged).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({ reason: 'solscan-key-rejected', status: 401 }),
        );
        logged.mockRestore();
    });

    it('should tag a transient upstream failure separately', async () => {
        const logged = vi.spyOn(Logger, 'error').mockImplementation(() => {});
        fetchMock.mockResolvedValueOnce({ json: async () => ({}), ok: false, status: 503 });

        await callRoute(VALID_ADDRESS);

        expect(logged).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({ reason: 'solscan-request-failed', status: 503 }),
        );
        logged.mockRestore();
    });

    it('should not cache a failed response', async () => {
        fetchMock.mockResolvedValueOnce({ json: async () => ({}), ok: false, status: 500 });

        const response = await callRoute(VALID_ADDRESS);

        expect(response.headers.get('Cache-Control')).toContain('no-store');
    });
});

function callRoute(address: string, query = '') {
    return GET(new Request(`https://explorer.solana.com/api/stake-rewards/${address}${query}`), {
        params: Promise.resolve({ address }),
    });
}

function mockPage(data: { amount: number; decimals: number; epoch: number }[]) {
    fetchMock.mockResolvedValueOnce({ json: async () => ({ data, success: true }), ok: true, status: 200 });
}
