import { checkBotId } from 'botid/server';
import { NextRequest } from 'next/server';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { botIdMiddleware } from '../botid-middleware.mjs';

// Set default log level for this test to avoid flaky tests if .env changes
const TEST_LOG_LEVEL = '0';

vi.mock('botid/server', () => ({
    checkBotId: vi.fn(),
}));

function createRequest(pathname: string, headers: Record<string, string> = {}): NextRequest {
    const url = new URL(pathname, 'http://localhost');
    return new NextRequest(url, { headers });
}

describe('botIdMiddleware', () => {
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
            { description: 'with x-is-human header', headers: { 'x-is-human': 'true' } },
            { description: 'without x-is-human header', headers: {} },
        ])('should pass through $description', async ({ headers }) => {
            const request = createRequest('/api/test', headers);
            const response = await botIdMiddleware(request);

            expect(response).toBeUndefined();
            expect(checkBotId).not.toHaveBeenCalled();
        });
    });

    describe('when feature flag is enabled', () => {
        beforeEach(() => {
            process.env.NEXT_PUBLIC_BOTID_ENABLED = 'true';
        });

        describe('without x-is-human header', () => {
            it('should pass through without verification and log info', async () => {
                const request = createRequest('/api/test');
                const response = await botIdMiddleware(request);

                expect(response).toBeUndefined();
                expect(checkBotId).not.toHaveBeenCalled();
                expect(loggerInfoSpy).toHaveBeenCalledWith(
                    '[botid] No x-is-human header, allowing',
                    expect.objectContaining({ pathname: '/api/test' }),
                );
            });
        });

        describe('when checkBotId throws', () => {
            it('should pass through and log warning when verification fails', async () => {
                vi.mocked(checkBotId).mockRejectedValue(new SyntaxError('Unexpected token < in JSON'));

                const request = createRequest('/api/test', { 'x-is-human': 'true' });
                const response = await botIdMiddleware(request);

                expect(response).toBeUndefined();
                expect(loggerWarnSpy).toHaveBeenCalledWith(
                    '[botid] BotId verification failed, allowing request',
                    expect.objectContaining({ pathname: '/api/test' }),
                );
            });
        });

        describe('with x-is-human header', () => {
            it('should pass through human requests and log verification info', async () => {
                vi.mocked(checkBotId).mockResolvedValue({
                    bypassed: false,
                    isBot: false,
                    isHuman: true,
                    isVerifiedBot: false,
                });

                const request = createRequest('/api/test', { 'x-is-human': 'true' });
                const response = await botIdMiddleware(request);

                expect(response).toBeUndefined();
                expect(checkBotId).toHaveBeenCalled();
                expect(loggerInfoSpy).toHaveBeenCalledWith(
                    '[botid] BotId verification',
                    expect.objectContaining({ isHuman: true }),
                );
                expect(loggerInfoSpy).toHaveBeenCalledWith(
                    '[botid] Human verified',
                    expect.objectContaining({ pathname: '/api/test' }),
                );
            });

            it('should pass through bot requests when challenge mode is disabled and log warning', async () => {
                vi.mocked(checkBotId).mockResolvedValue({
                    bypassed: false,
                    isBot: true,
                    isHuman: false,
                    isVerifiedBot: false,
                });

                const request = createRequest('/api/test', { 'x-is-human': 'true' });
                const response = await botIdMiddleware(request);

                expect(response).toBeUndefined();
                expect(loggerWarnSpy).toHaveBeenCalledWith(
                    '[botid] Bot detected',
                    expect.objectContaining({ pathname: '/api/test' }),
                );
            });
        });

        describe('with challenge mode enabled', () => {
            beforeEach(() => {
                process.env.NEXT_PUBLIC_BOTID_CHALLENGE_MODE_ENABLED = 'true';
            });

            it('should block bot requests with 401 and log error', async () => {
                vi.mocked(checkBotId).mockResolvedValue({
                    bypassed: false,
                    isBot: true,
                    isHuman: false,
                    isVerifiedBot: false,
                });

                const request = createRequest('/api/test', { 'x-is-human': 'true' });
                const response = await botIdMiddleware(request);

                if (!response) throw new Error('expected NextResponse from middleware');
                expect(response.status).toBe(401);
                const body = await response.json();
                expect(body).toEqual({ error: 'Access denied: request identified as automated bot' });
                expect(loggerWarnSpy).toHaveBeenCalledWith(
                    '[botid] Bot detected',
                    expect.objectContaining({ pathname: '/api/test' }),
                );
                expect(loggerErrorSpy).toHaveBeenCalledWith(
                    new Error('[botid] Challenge mode enabled, blocking'),
                    expect.objectContaining({ pathname: '/api/test' }),
                );
            });

            it('should block verified bot requests and log error', async () => {
                vi.mocked(checkBotId).mockResolvedValue({
                    bypassed: false,
                    isBot: true,
                    isHuman: false,
                    isVerifiedBot: true,
                });

                const request = createRequest('/api/test', { 'x-is-human': 'true' });
                const response = await botIdMiddleware(request);

                if (!response) throw new Error('expected NextResponse from middleware');
                expect(response.status).toBe(401);
                expect(loggerErrorSpy).toHaveBeenCalledWith(
                    new Error('[botid] Challenge mode enabled, blocking'),
                    expect.objectContaining({ pathname: '/api/test' }),
                );
            });

            it('should pass through human requests and log info', async () => {
                vi.mocked(checkBotId).mockResolvedValue({
                    bypassed: false,
                    isBot: false,
                    isHuman: true,
                    isVerifiedBot: false,
                });

                const request = createRequest('/api/test', { 'x-is-human': 'true' });
                const response = await botIdMiddleware(request);

                expect(response).toBeUndefined();
                expect(loggerInfoSpy).toHaveBeenCalledWith(
                    '[botid] Human verified',
                    expect.objectContaining({ pathname: '/api/test' }),
                );
            });
        });
    });

    describe('simulate bot mode', () => {
        it('should pass through when simulate bot mode is enabled but challenge mode is disabled', async () => {
            process.env.NEXT_PUBLIC_BOTID_ENABLED = 'true';
            process.env.NEXT_PUBLIC_BOTID_DEV_SIMULATE_BOT = 'true';

            vi.mocked(checkBotId).mockResolvedValue({
                bypassed: true,
                isBot: true,
                isHuman: false,
                isVerifiedBot: false,
            });

            const request = createRequest('/api/test', { 'x-is-human': 'true' });
            const response = await botIdMiddleware(request);

            expect(response).toBeUndefined();
            expect(loggerWarnSpy).toHaveBeenCalledWith(
                '[botid] Bot detected',
                expect.objectContaining({ pathname: '/api/test' }),
            );
        });

        it('should block request when both simulate bot mode and challenge mode are enabled', async () => {
            process.env.NEXT_PUBLIC_BOTID_ENABLED = 'true';
            process.env.NEXT_PUBLIC_BOTID_DEV_SIMULATE_BOT = 'true';
            process.env.NEXT_PUBLIC_BOTID_CHALLENGE_MODE_ENABLED = 'true';

            vi.mocked(checkBotId).mockResolvedValue({
                bypassed: true,
                isBot: true,
                isHuman: false,
                isVerifiedBot: false,
            });

            const request = createRequest('/api/test', { 'x-is-human': 'true' });
            const response = await botIdMiddleware(request);

            if (!response) throw new Error('expected NextResponse from middleware');
            expect(response.status).toBe(401);
            expect(loggerErrorSpy).toHaveBeenCalledWith(
                new Error('[botid] Challenge mode enabled, blocking'),
                expect.objectContaining({ pathname: '/api/test' }),
            );
        });
    });
});
