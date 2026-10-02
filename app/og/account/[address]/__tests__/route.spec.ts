import { gen } from '@__fixtures__/gen';
import { Cluster } from '@utils/cluster';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/og', () => ({
    ImageResponse: vi.fn(function () {
        return new Response('mock-image-response', { headers: { 'Content-Type': 'image/png' }, status: 200 });
    }),
}));

const mocks = vi.hoisted(() => ({ getAccountShareData: vi.fn(), loadOgFonts: vi.fn(), loadOgGlows: vi.fn() }));

vi.mock('@features/account-share/server', () => ({
    BaseAccountImage: vi.fn(() => null),
    getAccountShareData: mocks.getAccountShareData,
    loadOgGlows: mocks.loadOgGlows,
}));
vi.mock('@/app/shared/lib/og/fonts', () => ({ loadOgFonts: mocks.loadOgFonts }));
vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { GET } from '../route';

const ADDRESS = gen.address(1);

function get(path: string, address = ADDRESS) {
    return GET(new NextRequest(`http://localhost:3000${path}`), { params: Promise.resolve({ address }) });
}

beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadOgFonts.mockResolvedValue([]);
    mocks.loadOgGlows.mockResolvedValue({ notFound: 'not-found-glow', success: 'success-glow' });
    mocks.getAccountShareData.mockResolvedValue({ data: { address: ADDRESS, kind: 'account' }, kind: 'ok' });
});

describe('GET /og/account/[address]', () => {
    it('should render a resolved account with a long cache', async () => {
        const response = await get(`/og/account/${ADDRESS}`);

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('image/png');
        expect(response.headers.get('Cache-Control')).toContain('max-age=1800');
        expect(mocks.getAccountShareData).toHaveBeenCalledWith(ADDRESS, undefined);
    });

    it('should cache an incomplete card only briefly so a transient failure is not pinned', async () => {
        mocks.getAccountShareData.mockResolvedValue({
            data: { address: ADDRESS, incomplete: true, kind: 'account' },
            kind: 'ok',
        });

        const response = await get(`/og/account/${ADDRESS}`);

        expect(response.status).toBe(200);
        expect(response.headers.get('Cache-Control')).toContain('max-age=60');
    });

    it('should cache a not-found card only briefly', async () => {
        mocks.getAccountShareData.mockResolvedValue({
            data: { address: ADDRESS, kind: 'not-found', reason: 'never-used' },
            kind: 'ok',
        });

        const response = await get(`/og/account/${ADDRESS}`);

        expect(response.status).toBe(200);
        expect(response.headers.get('Cache-Control')).toContain('max-age=60');
    });

    it('should return 400 for an invalid address and not fetch', async () => {
        const response = await get('/og/account/not-base58!!!', 'not-base58!!!');

        expect(response.status).toBe(400);
        expect(await response.text()).toBe('Invalid address');
        expect(mocks.getAccountShareData).not.toHaveBeenCalled();
    });

    it('should resolve the cluster query and pass it through', async () => {
        const response = await get(`/og/account/${ADDRESS}?cluster=devnet`);

        expect(response.status).toBe(200);
        expect(mocks.getAccountShareData).toHaveBeenCalledWith(ADDRESS, Cluster.Devnet);
    });

    it('should return 400 for an unknown cluster slug', async () => {
        const response = await get(`/og/account/${ADDRESS}?cluster=nope`);

        expect(response.status).toBe(400);
        expect(await response.text()).toBe('Invalid cluster');
        expect(mocks.getAccountShareData).not.toHaveBeenCalled();
    });

    it('should reject a non-canonical query rather than serve a second cache key', async () => {
        const response = await get(`/og/account/${ADDRESS}?foo=bar`);

        expect(response.status).toBe(400);
        expect(await response.text()).toBe('Invalid cluster');
    });

    it('should return 502 when the data layer reports an error', async () => {
        mocks.getAccountShareData.mockResolvedValue({ kind: 'error' });

        const response = await get(`/og/account/${ADDRESS}`);

        expect(response.status).toBe(502);
    });

    it('should return 500 when rendering throws', async () => {
        mocks.getAccountShareData.mockRejectedValue(new Error('boom'));

        const response = await get(`/og/account/${ADDRESS}`);

        expect(response.status).toBe(500);
        expect(await response.text()).toBe('Failed to process request');
    });
});
