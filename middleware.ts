import { isEnvEnabled } from '@utils/env';
import { checkBotId } from 'botid/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Feature flag to disable bot protection
    if (!isEnvEnabled(process.env.NEXT_PUBLIC_BOTID_ENABLED)) {
        return NextResponse.next();
    }

    const { pathname } = request.nextUrl;

    const verification = await checkBotId({
        // Set a `bypass` rule to browse as a bot if needed
        developmentOptions: {
            bypass: isEnvEnabled(process.env.NEXT_PUBLIC_BOTID_SIMULATE_BOT) ? 'BAD-BOT' : undefined,
        },
    });

    // /api/* - block all bots (verified crawlers shouldn't hit API per robots.txt)
    if (pathname.startsWith('/api/')) {
        if (verification.isBot) {
            return new NextResponse('Forbidden', { status: 403 });
        }
    }

    // /tx/* - block bad bots, allow verified crawlers (Googlebot, Bingbot, etc.)
    if (pathname.startsWith('/tx/')) {
        if (verification.isBot && !verification.isVerifiedBot) {
            return new NextResponse('Forbidden', { status: 403 });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/:path*', '/tx/:path*'],
};

// BotIdClient protected routes config (used in ./app/layout.tsx )
export const botIdProtectedRoutes: { path: string; method: string }[] = [
    { path: '/api/*', method: '*' },
    { path: '/tx/*', method: 'GET' },
];
