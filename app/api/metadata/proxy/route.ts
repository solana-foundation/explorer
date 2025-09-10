import { NextResponse } from 'next/server';
import { Headers as NodeFetchHeaders } from 'node-fetch';

import Logger from '@/app/utils/logger';

import { fetchResource, StatusError } from './feature';
import { errors } from './feature/errors';
import { checkURLForPrivateIP, isHTTPProtocol } from './feature/ip';

type Params = { params: object };

const USER_AGENT = process.env.NEXT_PUBLIC_METADATA_USER_AGENT ?? 'Solana Explorer';
const MAX_SIZE = process.env.NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE
    ? Number(process.env.NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE)
    : 1_000_000; // 1 000 000 bytes
const TIMEOUT = process.env.NEXT_PUBLIC_METADATA_TIMEOUT ? Number(process.env.NEXT_PUBLIC_METADATA_TIMEOUT) : 10_000; // 10s

/**
 *  Respond with error in a JSON format
 */
function respondWithError(status: keyof typeof errors, message?: string) {
    return NextResponse.json({ error: message ?? errors[status].message }, { status });
}

export async function GET(request: Request, { params: _params }: Params) {
    const isProxyEnabled = process.env.NEXT_PUBLIC_METADATA_ENABLED === 'true';

    if (!isProxyEnabled) {
        return respondWithError(404);
    }

    let uriParam: string;
    try {
        const url = new URL(request.url);
        const queryParam = url.searchParams.get('uri');

        if (!queryParam) {
            throw new Error('Absent URI');
        }

        uriParam = decodeURIComponent(queryParam);

        const parsedUrl = new URL(uriParam);

        // check that uri has supported protocol despite of any other checks
        if (!isHTTPProtocol(parsedUrl)) {
            Logger.error(new Error('Unsupported protocol'), parsedUrl.protocol);
            return respondWithError(400);
        }

        const isPrivate = await checkURLForPrivateIP(parsedUrl);
        if (isPrivate) {
            Logger.error(new Error('Private IP detected'), parsedUrl.hostname);
            return respondWithError(403);
        }
    } catch (error) {
        Logger.error(error);
        return respondWithError(400);
    }

    const headers = new NodeFetchHeaders({
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': USER_AGENT,
    });

    let data;
    let resourceHeaders: NodeFetchHeaders;

    try {
        const response = await fetchResource(uriParam, headers, TIMEOUT, MAX_SIZE);

        data = response.data;
        resourceHeaders = response.headers;
    } catch (e) {
        const status = (e as StatusError)?.status;
        switch (status) {
            case 413:
            case 415:
            case 500:
            case 504: {
                return respondWithError(status);
            }
            default:
                return respondWithError(500);
        }
    }

    // preserve original cache-control headers
    // const contentLength = resourceHeaders.get('content-length');
    const responseHeaders: Record<string, string> = {
        'Cache-Control': resourceHeaders.get('cache-control') ?? 'no-cache',
        'Content-Type': resourceHeaders.get('content-type') ?? 'application/json; charset=utf-8',
        Etag: resourceHeaders.get('etag') ?? 'no-etag',
    };

    // Skipping Content-Length to avoid browser CORS issues:
    // - Some upstream metadata servers (e.g. AWS S3/CDNs) return a Content-Length header.
    // - When we forward it, the browser treats the response as a "non-simple" CORS response,
    //   requiring proper Access-Control-Allow-Origin headers.
    // - Since many upstream servers don’t return valid CORS headers, the browser blocks it
    //   with a misleading CORS or ERR_CONTENT_LENGTH_MISMATCH error, even if status is 200 OK.
    // - Other servers (like IPFS gateways) don’t include Content-Length and work fine.
    //
    // By omitting Content-Length entirely, the proxy response only includes safelisted headers,
    // allowing the browser to accept it without extra CORS checks. Next.js will handle the
    // body size automatically, so this is safe.

    // if (contentLength) {
    //     responseHeaders['Content-Length'] = contentLength;
    // }

    // Validate that all required headers are present
    const hasMissingHeaders = Object.values(responseHeaders).some(value => value == null);
    if (hasMissingHeaders) {
        return respondWithError(400);
    }

    if (data instanceof ArrayBuffer) {
        return new NextResponse(data, {
            headers: responseHeaders,
        });
    } else if (resourceHeaders.get('content-type')?.startsWith('application/json')) {
        return NextResponse.json(data, {
            headers: responseHeaders,
        });
    } else {
        return respondWithError(415);
    }
}
