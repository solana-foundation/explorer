import { checkBotId } from 'botid/server';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { proxy } from '../../proxy';

vi.mock('botid/server', () => ({
    checkBotId: vi.fn(),
}));

function createRequest(): NextRequest {
    return new NextRequest(new URL('/api/test', 'http://localhost'), { headers: { 'x-is-human': 'true' } });
}

describe('proxy — real BotID middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('NEXT_PUBLIC_BOTID_ENABLED', 'true');
        vi.stubEnv('NEXT_PUBLIC_BOTID_CHALLENGE_MODE_ENABLED', 'true');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('should pass through (200) for a human', async () => {
        vi.mocked(checkBotId).mockResolvedValue({ bypassed: false, isBot: false, isHuman: true, isVerifiedBot: false });

        const response = await proxy(createRequest());

        expect(response.status).toBe(200);
        expect(checkBotId).toHaveBeenCalledTimes(1);
    });

    it('should block (401) with the access-denied body when a bot is detected', async () => {
        vi.mocked(checkBotId).mockResolvedValue({ bypassed: false, isBot: true, isHuman: false, isVerifiedBot: false });

        const response = await proxy(createRequest());

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: 'Access denied: request identified as automated bot' });
    });
});
