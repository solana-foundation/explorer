import { isEnvEnabled } from '@utils/env';
import { checkBotId } from 'botid/server';
import { NextResponse, type NextRequest } from 'next/server';

const BOT_RESPONSE = { body: { error: 'Access denied: request identified as automated bot' }, status: 401 } as const;

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (!isEnvEnabled(process.env.NEXT_PUBLIC_BOTID_ENABLED)) {
        return NextResponse.next();
    }

    // Allow requests without x-is-human header (direct API calls)
    if (!request.headers.has('x-is-human')) {
        console.log(`[middleware] No x-is-human header, allowing: ${pathname}`);
        return NextResponse.next();
    }

    // Verify requests with x-is-human header (browser requests via BotIdClient)
    const verification = await checkBotId({
        developmentOptions: {
            bypass: isEnvEnabled(process.env.NEXT_PUBLIC_BOTID_SIMULATE_BOT) ? 'BAD-BOT' : undefined,
        },
    });

    console.log(`[middleware] BotId verification for ${pathname}:`, {
        isBot: verification.isBot,
        isHuman: verification.isHuman,
        isVerifiedBot: verification.isVerifiedBot,
        bypassed: verification.bypassed,
    });

    // Block bots only when challenge mode is enabled
    if (verification.isBot) {
        console.log(`[middleware] Bot detected: ${pathname}`);

        if (isEnvEnabled(process.env.NEXT_PUBLIC_BOT_CHALLENGE_MODE_ENABLED)) {
            console.log(`[middleware] Challenge mode enabled, blocking: ${pathname}`);
            return NextResponse.json(BOT_RESPONSE.body, { status: BOT_RESPONSE.status });
        }
    } else {
        console.log(`[middleware] Human verified, allowing: ${pathname}`);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/:path*'],
};

// BotIdClient protected routes - only API routes need protection
export const botIdProtectedRoutes: { path: string; method: string }[] = [{ path: '/api/*', method: '*' }];
