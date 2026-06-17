import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { botIdMiddleware } from '@/config/botid-middleware.mjs';

import { proxy } from '../../proxy';

vi.mock('@/config/botid-middleware.mjs', () => ({
    botIdMiddleware: vi.fn(),
}));

function createRequest(pathname: string): NextRequest {
    return new NextRequest(new URL(pathname, 'http://localhost'));
}

describe('Next.js proxy', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should pass through with 200 when middleware returns undefined', async () => {
        vi.mocked(botIdMiddleware).mockResolvedValue(undefined);

        const response = await proxy(createRequest('/api/test'));

        expect(response.status).toBe(200);
        expect(botIdMiddleware).toHaveBeenCalledTimes(1);
    });

    it('should return the middleware response verbatim when it short-circuits', async () => {
        const blocked = NextResponse.json({ error: 'blocked' }, { status: 401 });
        vi.mocked(botIdMiddleware).mockResolvedValue(blocked);

        const response = await proxy(createRequest('/api/test'));

        expect(response).toBe(blocked);
        expect(response.status).toBe(401);
    });
});
