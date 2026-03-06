import { NextRequest } from 'next/server';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Set default log level for this test to avoid flaky tests if .env changes
const TEST_LOG_LEVEL = '0';

vi.mock('botid/server', () => ({
    checkBotId: vi.fn(),
}));

import { Logger } from '@/app/shared/lib/logger';
import { checkBotId } from 'botid/server';

import { middleware } from '../middleware';

function createRequest(pathname: string, headers: Record<string, string> = {}): NextRequest {
    const url = new URL(pathname, 'http://localhost');
    return new NextRequest(url, { headers });
}

describe('middleware', () => {
    const originalEnv = { ...process.env };

    let loggerInfoSpy: ReturnType<typeof vi.spyOn>;
    let loggerWarnSpy: ReturnType<typeof vi.spyOn>;
    let loggerErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeAll(() => {
        process.env.NEXT_LOG_LEVEL = TEST_LOG_LEVEL;
    });

    beforeEach(() => {
        vi.clearAllMocks();
        process.env = { ...originalEnv, NEXT_LOG_LEVEL: TEST_LOG_LEVEL };

        loggerInfoSpy = vi.spyOn(Logger, 'info').mockImplementation(() => {});
        loggerWarnSpy = vi.spyOn(Logger, 'warn').mockImplementation(() => {});
        loggerErrorSpy = vi.spyOn(Logger, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        loggerInfoSpy.mockRestore();
        loggerWarnSpy.mockRestore();
        loggerErrorSpy.mockRestore();
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
            it('should allow request without verification and log info', async () => {
                const request = createRequest('/api/test');
                const response = await middleware(request);

                expect(response.status).toBe(200);
                expect(checkBotId).not.toHaveBeenCalled();
                expect(loggerInfoSpy).toHaveBeenCalledWith(
                    '[middleware] No x-is-human header, allowing',
                    expect.objectContaining({ pathname: '/api/test' })
                );
            });
        });

        describe('with x-is-human header', () => {
            it('should allow human requests and log verification info', async () => {
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
                expect(loggerInfoSpy).toHaveBeenCalledWith(
                    '[middleware] BotId verification',
                    expect.objectContaining({ isHuman: true })
                );
                expect(loggerInfoSpy).toHaveBeenCalledWith(
                    '[middleware] Human verified',
                    expect.objectContaining({ pathname: '/api/test' })
                );
            });

            it('should allow bot requests when challenge mode is disabled and log warning', async () => {
                vi.mocked(checkBotId).mockResolvedValue({
                    isBot: true,
                    isVerifiedBot: false,
                    isHuman: false,
                    bypassed: false,
                });

                const request = createRequest('/api/test', { 'x-is-human': 'true' });
                const response = await middleware(request);

                expect(response.status).toBe(200);
                expect(loggerWarnSpy).toHaveBeenCalledWith(
                    '[middleware] Bot detected',
                    expect.objectContaining({ pathname: '/api/test' })
                );
            });
        });

        describe('with challenge mode enabled', () => {
            beforeEach(() => {
                process.env.NEXT_PUBLIC_BOTID_CHALLENGE_MODE_ENABLED = 'true';
            });

            it('should block bot requests with 401 and log error', async () => {
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
                expect(loggerWarnSpy).toHaveBeenCalledWith(
                    '[middleware] Bot detected',
                    expect.objectContaining({ pathname: '/api/test' })
                );
                expect(loggerErrorSpy).toHaveBeenCalledWith(
                    '[middleware] Challenge mode enabled, blocking',
                    expect.objectContaining({ pathname: '/api/test' })
                );
            });

            it('should block verified bot requests and log error', async () => {
                vi.mocked(checkBotId).mockResolvedValue({
                    isBot: true,
                    isVerifiedBot: true,
                    isHuman: false,
                    bypassed: false,
                });

                const request = createRequest('/api/test', { 'x-is-human': 'true' });
                const response = await middleware(request);

                expect(response.status).toBe(401);
                expect(loggerErrorSpy).toHaveBeenCalledWith(
                    '[middleware] Challenge mode enabled, blocking',
                    expect.objectContaining({ pathname: '/api/test' })
                );
            });

            it('should allow human requests and log info', async () => {
                vi.mocked(checkBotId).mockResolvedValue({
                    isBot: false,
                    isVerifiedBot: false,
                    isHuman: true,
                    bypassed: false,
                });

                const request = createRequest('/api/test', { 'x-is-human': 'true' });
                const response = await middleware(request);

                expect(response.status).toBe(200);
                expect(loggerInfoSpy).toHaveBeenCalledWith(
                    '[middleware] Human verified',
                    expect.objectContaining({ pathname: '/api/test' })
                );
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
            expect(loggerWarnSpy).toHaveBeenCalledWith(
                '[middleware] Bot detected',
                expect.objectContaining({ pathname: '/api/test' })
            );
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
            expect(loggerErrorSpy).toHaveBeenCalledWith(
                '[middleware] Challenge mode enabled, blocking',
                expect.objectContaining({ pathname: '/api/test' })
            );
        });
    });
});
