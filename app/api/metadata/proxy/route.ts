import { NextResponse } from 'next/server';
import { Headers } from 'node-fetch';

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

    const headers = new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': USER_AGENT,
    });

    let data;
    let resourceHeaders: Headers;

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
    const contentLength = resourceHeaders.get('content-length');
    const responseHeaders: Record<string, string> = {
        'Cache-Control': resourceHeaders.get('cache-control') ?? 'no-cache',
        'Content-Type': resourceHeaders.get('content-type') ?? 'application/json; charset=utf-8',
        Etag: resourceHeaders.get('etag') ?? 'no-etag',
    };

    // Only set Content-Length if it exists in the original response
    if (contentLength) {
        responseHeaders['Content-Length'] = contentLength;
    }

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
