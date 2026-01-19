import { isEnvEnabled } from '@utils/env';
import { checkBotId } from 'botid/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Feature flag to disable bot protection
    if (!isEnvEnabled(process.env.NEXT_PUBLIC_BOTID_ENABLED)) {
        return NextResponse.next();
    }

    const { pathname } = request.nextUrl;

    // Only check requests that have the x-is-human header (set by BotIdClient on fetch/XHR)
    // Page navigations don't have this header, so they pass through
    // const hasHumanHeader = request.headers.has('x-is-human');
    // if (hasHumanHeader) {
    //     console.log('is_human');
    //     // return NextResponse.next();
    // }

    const verification = await checkBotId({
        developmentOptions: {
            bypass: isEnvEnabled(process.env.NEXT_PUBLIC_BOTID_SIMULATE_BOT) ? 'BAD-BOT' : undefined,
        },
    });

    console.log({ verification });

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
