import { NextRequest } from 'next/server';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('botid/server', () => ({
    checkBotId: vi.fn(),
}));

vi.spyOn(console, 'log').mockImplementation(() => {});

import { checkBotId } from 'botid/server';

import { middleware } from '../middleware';

function createRequest(pathname: string, headers: Record<string, string> = {}): NextRequest {
    const url = new URL(pathname, 'http://localhost');
    return new NextRequest(url, { headers });
}

describe('middleware', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.clearAllMocks();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('when feature flag is disabled', () => {
        beforeEach(() => {
            delete process.env.NEXT_PUBLIC_BOTID_ENABLED;
        });

        it.each<{ headers: Record<string, string>; description: string }>([
            { headers: { 'x-is-human': 'true' }, description: 'with x-is-human header' },
            { headers: {}, description: 'without x-is-human header' },
        ])('should allow request to pass through $description', async ({ headers }) => {
            const request = createRequest('/api/test', headers);
            const response = await middleware(request);

            expect(response.status).toBe(200);
            expect(checkBotId).not.toHaveBeenCalled();
        });
    });

    describe('when feature flag is enabled', () => {
        beforeEach(() => {
            process.env.NEXT_PUBLIC_BOTID_ENABLED = 'true';
        });

        describe('without x-is-human header', () => {
            it('should allow request without verification', async () => {
                const request = createRequest('/api/test');
                const response = await middleware(request);

                expect(response.status).toBe(200);
                expect(checkBotId).not.toHaveBeenCalled();
            });
        });

        describe('with x-is-human header', () => {
            it('should allow human requests to /api/* routes', async () => {
                vi.mocked(checkBotId).mockResolvedValue({
                    isBot: false,
                    isVerifiedBot: false,
                    isHuman: true,
                    bypassed: false,
                });

                const request = createRequest('/api/test', { 'x-is-human': 'true' });
                const response = await middleware(request);

                expect(response.status).toBe(200);
                expect(checkBotId).toHaveBeenCalled();
            });

            it('should allow bot requests when challenge mode is disabled', async () => {
                vi.mocked(checkBotId).mockResolvedValue({
                    isBot: true,
                    isVerifiedBot: false,
                    isHuman: false,
                    bypassed: false,
                });

                const request = createRequest('/api/test', { 'x-is-human': 'true' });
                const response = await middleware(request);

                expect(response.status).toBe(200);
            });
        });

        describe('with challenge mode enabled', () => {
            beforeEach(() => {
                process.env.NEXT_PUBLIC_BOTID_CHALLENGE_MODE_ENABLED = 'true';
            });

            it('should block bot requests with 401 and explicit message', async () => {
                vi.mocked(checkBotId).mockResolvedValue({
                    isBot: true,
                    isVerifiedBot: false,
                    isHuman: false,
                    bypassed: false,
                });

                const request = createRequest('/api/test', { 'x-is-human': 'true' });
                const response = await middleware(request);

                expect(response.status).toBe(401);
                const body = await response.json();
                expect(body).toEqual({ error: 'Access denied: request identified as automated bot' });
            });

            it('should block verified bot requests', async () => {
                vi.mocked(checkBotId).mockResolvedValue({
                    isBot: true,
                    isVerifiedBot: true,
                    isHuman: false,
                    bypassed: false,
                });

                const request = createRequest('/api/test', { 'x-is-human': 'true' });
                const response = await middleware(request);

                expect(response.status).toBe(401);
            });

            it('should allow human requests', async () => {
                vi.mocked(checkBotId).mockResolvedValue({
                    isBot: false,
                    isVerifiedBot: false,
                    isHuman: true,
                    bypassed: false,
                });

                const request = createRequest('/api/test', { 'x-is-human': 'true' });
                const response = await middleware(request);

                expect(response.status).toBe(200);
            });
        });
    });

    describe('simulate bot mode', () => {
        it('should allow request when simulate bot mode is enabled but challenge mode is disabled', async () => {
            process.env.NEXT_PUBLIC_BOTID_ENABLED = 'true';
            process.env.NEXT_PUBLIC_BOTID_SIMULATE_BOT = 'true';

            vi.mocked(checkBotId).mockResolvedValue({
                isBot: true,
                isVerifiedBot: false,
                isHuman: false,
                bypassed: true,
            });

            const request = createRequest('/api/test', { 'x-is-human': 'true' });
            const response = await middleware(request);

            expect(response.status).toBe(200);
        });

        it('should block request when both simulate bot mode and challenge mode are enabled', async () => {
            process.env.NEXT_PUBLIC_BOTID_ENABLED = 'true';
            process.env.NEXT_PUBLIC_BOTID_SIMULATE_BOT = 'true';
            process.env.NEXT_PUBLIC_BOTID_CHALLENGE_MODE_ENABLED = 'true';

            vi.mocked(checkBotId).mockResolvedValue({
                isBot: true,
                isVerifiedBot: false,
                isHuman: false,
                bypassed: true,
            });

            const request = createRequest('/api/test', { 'x-is-human': 'true' });
            const response = await middleware(request);

            expect(response.status).toBe(401);
        });
    });
});
