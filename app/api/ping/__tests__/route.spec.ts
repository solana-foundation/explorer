import fetch, { Response } from 'node-fetch';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { GET, ValidatorsAppPingStats } from '../[network]/route';

vi.mock('node-fetch', () => ({
    default: vi.fn(),
}));

vi.mock('@/app/shared/lib/logger', () => ({
    Logger: { error: vi.fn(), panic: vi.fn(), warn: vi.fn() },
}));

const PING_INTERVALS = [1, 3, 12];

describe('Ping API Route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each(['devnet', 'testnet', 'mainnet-beta', ''])(
        'should reject "%s" with 404 and no-store cache',
        async network => {
            const response = await callRoute(network);

            expect(response.status).toBe(404);
            expect(await response.json()).toEqual({ error: `Network "${network}" is not supported` });
            expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0');
            expect(fetch).not.toHaveBeenCalled();
        },
    );

    describe('mainnet', () => {
        it('should return ping stats keyed by interval with public cache headers', async () => {
            const statsByInterval: Record<number, ValidatorsAppPingStats[]> = {
                1: [makeStats({ interval: 1, median: 1.1 })],
                12: [makeStats({ interval: 12, median: 12.12 })],
                3: [makeStats({ interval: 3, median: 3.3 })],
            };
            mockFetchPerInterval(interval => ({
                json: async () => statsByInterval[interval],
                ok: true,
            }));

            const response = await callRoute('mainnet');

            expect(response.status).toBe(200);
            expect(response.headers.get('Cache-Control')).toBe(
                'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
            );
            expect(await response.json()).toEqual(statsByInterval);
        });

        it('should call validators.app once per interval with the api token', async () => {
            mockFetchPerInterval(() => ({ json: async () => [], ok: true }));

            await callRoute('mainnet');

            expect(fetch).toHaveBeenCalledTimes(PING_INTERVALS.length);
            for (const interval of PING_INTERVALS) {
                expect(fetch).toHaveBeenCalledWith(
                    `https://www.validators.app/api/v1/ping-thing-stats/mainnet.json?interval=${interval}`,
                    { headers: { Token: expect.any(String) } },
                );
            }
        });

        it('should return 500 with no-store cache when upstream responds with non-OK', async () => {
            mockFetchPerInterval(interval =>
                interval === 1
                    ? { ok: false, status: 502, statusText: 'Bad Gateway', text: async () => '' }
                    : { json: async () => [], ok: true },
            );

            const response = await callRoute('mainnet');

            expect(response.status).toBe(500);
            expect(await response.json()).toEqual({ error: 'Failed to fetch ping data' });
            expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0');
            expect(Logger.panic).toHaveBeenCalledTimes(1);
        });

        it('should return 500 when upstream returns a non-array payload', async () => {
            mockFetchPerInterval(() => ({ json: async () => ({ unexpected: 'shape' }), ok: true }));

            const response = await callRoute('mainnet');

            expect(response.status).toBe(500);
            expect(await response.json()).toEqual({ error: 'Failed to fetch ping data' });
            expect(Logger.panic).toHaveBeenCalledTimes(1);
        });
    });
});

function callRoute(network: string) {
    const request = new Request(`http://localhost:3000/api/ping/${network}`);
    return GET(request, { params: Promise.resolve({ network }) });
}

function mockFetchPerInterval(makeResponse: (interval: number) => Partial<Response>) {
    vi.mocked(fetch).mockImplementation(async input => {
        const url = typeof input === 'string' ? input : input.toString();
        const interval = Number(new URL(url).searchParams.get('interval'));
        // Cast: tests only stub the surface of node-fetch's Response that the route touches.
        return makeResponse(interval) as Response;
    });
}

function makeStats(overrides: Partial<ValidatorsAppPingStats> = {}): ValidatorsAppPingStats {
    return {
        average_slot_latency: 0.5,
        interval: 1,
        max: 2,
        median: 1,
        min: 0.1,
        network: 'mainnet',
        num_of_records: 100,
        time_from: '2026-01-01T00:00:00Z',
        tps: 4000,
        ...overrides,
    };
}
