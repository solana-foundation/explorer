import { checkBotId } from 'botid/server';
import { NextRequest } from 'next/server';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

// Exercises the real proxy → botIdMiddleware stack (unmocked). Asserts observable
// behaviour — return status/body, whether checkBotId ran, which log LEVEL fired with
// pathname context — NOT log message prefixes, so it stays valid across the intentional
// `[proxy]` → `[botid]` rename.
import { proxy } from '../../proxy';

const TEST_LOG_LEVEL = '0';

vi.mock('botid/server', () => ({
    checkBotId: vi.fn(),
}));

function createRequest(pathname: string, headers: Record<string, string> = {}): NextRequest {
    return new NextRequest(new URL(pathname, 'http://localhost'), { headers });
}

describe('proxy — real BotID middleware', () => {
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

        it.each<{ description: string; headers: Record<string, string> }>([
            { description: 'with x-is-human header', headers: { 'x-is-human': 'true' } },
            { description: 'without x-is-human header', headers: {} },
        ])('should pass through (200) without calling checkBotId $description', async ({ headers }) => {
            const response = await proxy(createRequest('/api/test', headers));

            expect(response.status).toBe(200);
            expect(checkBotId).not.toHaveBeenCalled();
        });
    });

    describe('when feature flag is enabled', () => {
        beforeEach(() => {
            process.env.NEXT_PUBLIC_BOTID_ENABLED = 'true';
        });

        it('should pass through (200) and log info when x-is-human header is absent', async () => {
            const response = await proxy(createRequest('/api/test'));

            expect(response.status).toBe(200);
            expect(checkBotId).not.toHaveBeenCalled();
            expect(loggerInfoSpy).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ pathname: '/api/test' }),
            );
        });

        it('should pass through (200) and warn when checkBotId throws', async () => {
            vi.mocked(checkBotId).mockRejectedValue(new SyntaxError('Unexpected token < in JSON'));

            const response = await proxy(createRequest('/api/test', { 'x-is-human': 'true' }));

            expect(response.status).toBe(200);
            expect(loggerWarnSpy).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ pathname: '/api/test' }),
            );
            expect(loggerErrorSpy).not.toHaveBeenCalled();
        });

        it('should pass through (200) and log verification info for a human', async () => {
            vi.mocked(checkBotId).mockResolvedValue({
                bypassed: false,
                isBot: false,
                isHuman: true,
                isVerifiedBot: false,
            });

            const response = await proxy(createRequest('/api/test', { 'x-is-human': 'true' }));

            expect(response.status).toBe(200);
            expect(checkBotId).toHaveBeenCalled();
            expect(loggerInfoSpy).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ isHuman: true }));
            expect(loggerErrorSpy).not.toHaveBeenCalled();
        });

        it('should pass through (200) and warn when a bot is detected and challenge mode is off', async () => {
            vi.mocked(checkBotId).mockResolvedValue({
                bypassed: false,
                isBot: true,
                isHuman: false,
                isVerifiedBot: false,
            });

            const response = await proxy(createRequest('/api/test', { 'x-is-human': 'true' }));

            expect(response.status).toBe(200);
            expect(loggerWarnSpy).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ pathname: '/api/test' }),
            );
            expect(loggerErrorSpy).not.toHaveBeenCalled();
        });

        it('should pass through (200) for a verified bot when challenge mode is off', async () => {
            vi.mocked(checkBotId).mockResolvedValue({
                bypassed: false,
                isBot: true,
                isHuman: false,
                isVerifiedBot: true,
            });

            const response = await proxy(createRequest('/api/test', { 'x-is-human': 'true' }));

            expect(response.status).toBe(200);
            expect(checkBotId).toHaveBeenCalled();
            expect(loggerErrorSpy).not.toHaveBeenCalled();
        });

        describe('with challenge mode enabled', () => {
            beforeEach(() => {
                process.env.NEXT_PUBLIC_BOTID_CHALLENGE_MODE_ENABLED = 'true';
            });

            it('should block (401) with the access-denied body when a bot is detected', async () => {
                vi.mocked(checkBotId).mockResolvedValue({
                    bypassed: false,
                    isBot: true,
                    isHuman: false,
                    isVerifiedBot: false,
                });

                const response = await proxy(createRequest('/api/test', { 'x-is-human': 'true' }));

                expect(response.status).toBe(401);
                expect(await response.json()).toEqual({
                    error: 'Access denied: request identified as automated bot',
                });
                expect(loggerErrorSpy).toHaveBeenCalledWith(
                    expect.any(Error),
                    expect.objectContaining({ pathname: '/api/test' }),
                );
            });

            it('should block (401) for a verified bot', async () => {
                vi.mocked(checkBotId).mockResolvedValue({
                    bypassed: false,
                    isBot: true,
                    isHuman: false,
                    isVerifiedBot: true,
                });

                const response = await proxy(createRequest('/api/test', { 'x-is-human': 'true' }));

                expect(response.status).toBe(401);
            });

            it('should pass through (200) for a human', async () => {
                vi.mocked(checkBotId).mockResolvedValue({
                    bypassed: false,
                    isBot: false,
                    isHuman: true,
                    isVerifiedBot: false,
                });

                const response = await proxy(createRequest('/api/test', { 'x-is-human': 'true' }));

                expect(response.status).toBe(200);
                expect(checkBotId).toHaveBeenCalled();
                expect(loggerErrorSpy).not.toHaveBeenCalled();
            });
        });
    });

    describe('simulate-bot mode', () => {
        it('should pass through (200) when simulate-bot is on and challenge mode is off', async () => {
            process.env.NEXT_PUBLIC_BOTID_ENABLED = 'true';
            process.env.NEXT_PUBLIC_BOTID_SIMULATE_BOT = 'true';

            vi.mocked(checkBotId).mockResolvedValue({
                bypassed: true,
                isBot: true,
                isHuman: false,
                isVerifiedBot: false,
            });

            const response = await proxy(createRequest('/api/test', { 'x-is-human': 'true' }));

            expect(response.status).toBe(200);
            expect(checkBotId).toHaveBeenCalledWith(
                expect.objectContaining({ developmentOptions: { bypass: 'BAD-BOT' } }),
            );
            expect(loggerErrorSpy).not.toHaveBeenCalled();
        });

        it('should block (401) when simulate-bot and challenge mode are both on', async () => {
            process.env.NEXT_PUBLIC_BOTID_ENABLED = 'true';
            process.env.NEXT_PUBLIC_BOTID_SIMULATE_BOT = 'true';
            process.env.NEXT_PUBLIC_BOTID_CHALLENGE_MODE_ENABLED = 'true';

            vi.mocked(checkBotId).mockResolvedValue({
                bypassed: true,
                isBot: true,
                isHuman: false,
                isVerifiedBot: false,
            });

            const response = await proxy(createRequest('/api/test', { 'x-is-human': 'true' }));

            expect(response.status).toBe(401);
            expect(checkBotId).toHaveBeenCalledWith(
                expect.objectContaining({ developmentOptions: { bypass: 'BAD-BOT' } }),
            );
        });
    });
});
