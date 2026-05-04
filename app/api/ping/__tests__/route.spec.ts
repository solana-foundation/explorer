import { describe, expect, it, vi } from 'vitest';

import { GET } from '../[network]/route';

vi.mock('@/app/shared/lib/logger', () => ({
    Logger: { error: vi.fn(), panic: vi.fn(), warn: vi.fn() },
}));

describe('Ping API Route', () => {
    it.each(['devnet', 'testnet', 'mainnet-beta', ''])(
        'should reject "%s" with 404 and no-store cache',
        async network => {
            const response = await callRoute(network);

            expect(response.status).toBe(404);
            expect(await response.json()).toEqual({ error: `Network "${network}" is not supported` });
            expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0');
        },
    );
});

function callRoute(network: string) {
    const request = new Request(`http://localhost:3000/api/ping/${network}`);
    return GET(request, { params: Promise.resolve({ network }) });
}
