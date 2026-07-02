import { isEnvEnabled } from '@utils/env';
import { checkBotId } from 'botid/server';
import { NextResponse } from 'next/server';

import { Logger } from '@/app/shared/lib/logger';

const BOT_RESPONSE = { body: { error: 'Access denied: request identified as automated bot' }, status: 401 };

/**
 * BotIdClient protected routes — only API routes need protection.
 * Must mirror `proxy.ts` matcher in BotID's glob format.
 *
 * @type {Array<{ path: string; method: string }>}
 */
export const botIdProtectedRoutes = [{ method: '*', path: '/api/*' }];

/**
 * BotId verification middleware. Returns a `NextResponse` to block, or `undefined` to pass through.
 * Fail-open by design: thrown errors and the disabled flag both pass through.
 *
 * @param {import('next/server').NextRequest} request
 * @returns {Promise<import('next/server').NextResponse | undefined>}
 */
export async function botIdMiddleware(request) {
    const { pathname } = request.nextUrl;

    if (!isEnvEnabled(process.env.NEXT_PUBLIC_BOTID_ENABLED)) {
        return;
    }

    // Allow requests without x-is-human header (direct API calls)
    if (!request.headers.has('x-is-human')) {
        Logger.info('[botid] No x-is-human header, allowing', { pathname });
        return;
    }

    // Verify requests with x-is-human header (browser requests via BotIdClient)
    let verification;
    try {
        verification = await checkBotId({
            developmentOptions: {
                bypass: isEnvEnabled(process.env.NEXT_PUBLIC_BOTID_DEV_SIMULATE_BOT) ? 'BAD-BOT' : undefined,
            },
        });
    } catch (error) {
        // checkBotId throws SyntaxError when Vercel returns non-JSON (e.g. 504 HTML).
        Logger.warn('[botid] BotId verification failed, allowing request', { error, pathname });
        return;
    }

    Logger.info('[botid] BotId verification', {
        bypassed: verification.bypassed,
        isBot: verification.isBot,
        isHuman: verification.isHuman,
        isVerifiedBot: verification.isVerifiedBot,
        pathname,
    });

    // Bot detected: warn always; only block under challenge mode.
    if (verification.isBot) {
        Logger.warn('[botid] Bot detected', { pathname });

        if (isEnvEnabled(process.env.NEXT_PUBLIC_BOTID_CHALLENGE_MODE_ENABLED)) {
            Logger.error(new Error('[botid] Challenge mode enabled, blocking'), { pathname });
            return NextResponse.json(BOT_RESPONSE.body, { status: BOT_RESPONSE.status });
        }
    } else {
        Logger.info('[botid] Human verified', { pathname });
    }
}
