import { NextResponse } from 'next/server';
import fetch, { Headers } from 'node-fetch';

import { Logger } from '@/app/shared/lib/logger';

import { NO_STORE_HEADERS, parseResponseBody,PROXY_TIMEOUT_MS } from '../config';
import { getHeliusSearchApiBaseUrl } from '../helius-search-config';

export async function POST(request: Request) {
    const baseUrl = getHeliusSearchApiBaseUrl();
    if (!baseUrl) {
        Logger.error(new Error('[api:search:auth] Helius search API base URL is not configured'));
        return NextResponse.json(
            { error: 'Helius search is not configured' },
            { headers: NO_STORE_HEADERS, status: 500 },
        );
    }

    const upstreamHeaders = new Headers({ 'Content-Type': 'application/json' });
    const turnstileToken = request.headers.get('X-Turnstile-Token');
    if (turnstileToken) {
        upstreamHeaders.set('X-Turnstile-Token', turnstileToken);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

    try {
        const upstreamResponse = await fetch(`${baseUrl}/turnstile/verify`, {
            headers: upstreamHeaders,
            method: 'POST',
            signal: controller.signal,
        });

        const responseText = await upstreamResponse.text();
        const responseBody = parseResponseBody(responseText);

        return NextResponse.json(responseBody, {
            headers: NO_STORE_HEADERS,
            status: upstreamResponse.status,
        });
    } catch (error) {
        Logger.error(error instanceof Error ? error : new Error('[api:search:auth] Helius search auth proxy failed'));
        return NextResponse.json({ error: 'Helius search auth failed' }, { headers: NO_STORE_HEADERS, status: 502 });
    } finally {
        clearTimeout(timeoutId);
    }
}
