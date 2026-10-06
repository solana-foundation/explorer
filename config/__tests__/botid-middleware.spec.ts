import { checkBotId } from 'botid/server';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { botIdMiddleware } from '../botid-middleware.mjs';

vi.mock('botid/server', () => ({
    checkBotId: vi.fn(),
}));

const HUMAN = { bypassed: false, isBot: false, isHuman: true, isVerifiedBot: false };
const BOT = { bypassed: false, isBot: true, isHuman: false, isVerifiedBot: false };
const SIMULATED_BOT = { ...BOT, bypassed: true };

function createRequest(pathname: string, headers: Record<string, string> = {}): NextRequest {
    const url = new URL(pathname, 'http://localhost');
    return new NextRequest(url, { headers });
}

describe('botIdMiddleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    describe('when feature flag is disabled', () => {
        beforeEach(() => {
            vi.stubEnv('NEXT_PUBLIC_BOTID_ENABLED', undefined);
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
            vi.stubEnv('NEXT_PUBLIC_BOTID_ENABLED', 'true');
        });

        describe('without x-is-human header', () => {
            it('should pass through without verification and log info', async () => {
                const request = createRequest('/api/test');
                const response = await botIdMiddleware(request);

                expect(response).toBeUndefined();
                expect(checkBotId).not.toHaveBeenCalled();
                expect(Logger.info).toHaveBeenCalledWith(
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
                expect(Logger.warn).toHaveBeenCalledWith(
                    '[botid] BotId verification failed, allowing request',
                    expect.objectContaining({ pathname: '/api/test' }),
                );
                expect(Logger.error).not.toHaveBeenCalled();
            });
        });

        describe('with x-is-human header', () => {
            it('should pass through human requests and log verification info', async () => {
                vi.mocked(checkBotId).mockResolvedValue(HUMAN);

                const request = createRequest('/api/test', { 'x-is-human': 'true' });
                const response = await botIdMiddleware(request);

                expect(response).toBeUndefined();
                expect(checkBotId).toHaveBeenCalled();
                expect(Logger.info).toHaveBeenCalledWith(
                    '[botid] BotId verification',
                    expect.objectContaining({ isHuman: true }),
                );
                expect(Logger.info).toHaveBeenCalledWith(
                    '[botid] Human verified',
                    expect.objectContaining({ pathname: '/api/test' }),
                );
                expect(Logger.error).not.toHaveBeenCalled();
            });

            it.each([
                { description: 'bot', verification: BOT },
                { description: 'verified bot', verification: { ...BOT, isVerifiedBot: true } },
            ])(
                'should pass through $description requests when challenge mode is disabled and log warning',
                async ({ verification }) => {
                    vi.mocked(checkBotId).mockResolvedValue(verification);

                    const request = createRequest('/api/test', { 'x-is-human': 'true' });
                    const response = await botIdMiddleware(request);

                    expect(response).toBeUndefined();
                    expect(checkBotId).toHaveBeenCalled();
                    expect(Logger.warn).toHaveBeenCalledWith(
                        '[botid] Bot detected',
                        expect.objectContaining({ pathname: '/api/test' }),
                    );
                    expect(Logger.error).not.toHaveBeenCalled();
                },
            );
        });

        describe('with challenge mode enabled', () => {
            beforeEach(() => {
                vi.stubEnv('NEXT_PUBLIC_BOTID_CHALLENGE_MODE_ENABLED', 'true');
            });

            it.each([
                { description: 'bot', verification: BOT },
                { description: 'verified bot', verification: { ...BOT, isVerifiedBot: true } },
            ])('should block $description requests with 401 and log error', async ({ verification }) => {
                vi.mocked(checkBotId).mockResolvedValue(verification);

                const request = createRequest('/api/test', { 'x-is-human': 'true' });
                const response = await botIdMiddleware(request);

                if (!response) throw new Error('expected NextResponse from middleware');
                expect(response.status).toBe(401);
                const body = await response.json();
                expect(body).toEqual({ error: 'Access denied: request identified as automated bot' });
                expect(Logger.warn).toHaveBeenCalledWith(
                    '[botid] Bot detected',
                    expect.objectContaining({ pathname: '/api/test' }),
                );
                expect(Logger.error).toHaveBeenCalledWith(
                    new Error('[botid] Challenge mode enabled, blocking'),
                    expect.objectContaining({ pathname: '/api/test' }),
                );
            });

            it('should pass through human requests and log info', async () => {
                vi.mocked(checkBotId).mockResolvedValue(HUMAN);

                const request = createRequest('/api/test', { 'x-is-human': 'true' });
                const response = await botIdMiddleware(request);

                expect(response).toBeUndefined();
                expect(checkBotId).toHaveBeenCalled();
                expect(Logger.info).toHaveBeenCalledWith(
                    '[botid] Human verified',
                    expect.objectContaining({ pathname: '/api/test' }),
                );
                expect(Logger.error).not.toHaveBeenCalled();
            });
        });
    });

    describe('simulate bot mode', () => {
        beforeEach(() => {
            vi.stubEnv('NEXT_PUBLIC_BOTID_ENABLED', 'true');
            vi.stubEnv('NEXT_PUBLIC_BOTID_DEV_SIMULATE_BOT', 'true');
            vi.mocked(checkBotId).mockResolvedValue(SIMULATED_BOT);
        });

        it('should pass through when simulate bot mode is enabled but challenge mode is disabled', async () => {
            const request = createRequest('/api/test', { 'x-is-human': 'true' });
            const response = await botIdMiddleware(request);

            expect(response).toBeUndefined();
            expect(checkBotId).toHaveBeenCalledWith(
                expect.objectContaining({ developmentOptions: { bypass: 'BAD-BOT' } }),
            );
            expect(Logger.warn).toHaveBeenCalledWith(
                '[botid] Bot detected',
                expect.objectContaining({ pathname: '/api/test' }),
            );
            expect(Logger.error).not.toHaveBeenCalled();
        });

        it('should block request when both simulate bot mode and challenge mode are enabled', async () => {
            vi.stubEnv('NEXT_PUBLIC_BOTID_CHALLENGE_MODE_ENABLED', 'true');

            const request = createRequest('/api/test', { 'x-is-human': 'true' });
            const response = await botIdMiddleware(request);

            if (!response) throw new Error('expected NextResponse from middleware');
            expect(response.status).toBe(401);
            expect(checkBotId).toHaveBeenCalledWith(
                expect.objectContaining({ developmentOptions: { bypass: 'BAD-BOT' } }),
            );
            expect(Logger.error).toHaveBeenCalledWith(
                new Error('[botid] Challenge mode enabled, blocking'),
                expect.objectContaining({ pathname: '/api/test' }),
            );
        });
    });
});
