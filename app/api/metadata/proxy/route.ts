import { NextResponse } from 'next/server';
import { Headers } from 'node-fetch';

import { fetchResource, StatusError } from './feature';
import { errors } from './feature/errors';

type Params = { params: {} }

const USER_AGENT = process.env.NEXT_PUBLIC_METADATA_USER_AGENT ?? 'Solana Explorer';
const MAX_SIZE = process.env.NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE
    ? Number(process.env.NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE)
    : 1_000_000; // 1 000 000 bytes
const TIMEOUT = process.env.NEXT_PUBLIC_METADATA_TIMEOUT
    ? Number(process.env.NEXT_PUBLIC_METADATA_TIMEOUT)
    : 10_000; // 10s

export async function GET(
    request: Request,
    { params: _params }: Params,
) {
    const isProxyEnabled = process.env.NEXT_PUBLIC_METADATA_ENABLED === 'true';

    if (!isProxyEnabled) {
        return NextResponse.json({ error: errors[404].message }, { status: 404 });
    }

    let uriParam: string;
    try {
        const url = new URL(request.url);
        const queryParam = url.searchParams.get('uri');

        if (!queryParam) {
            throw new Error('Absent URI');
        }

        uriParam = decodeURI(queryParam);
    } catch(_error) {
        return NextResponse.json({ error: errors[400].message }, { status: 400 })
    }

    const headers = new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': USER_AGENT
    });

    let data;
    let resourceHeaders: Headers;

    try {
        const response = await fetchResource(uriParam, headers, TIMEOUT, MAX_SIZE);

        data = response.data;
        resourceHeaders = response.headers;
    } catch(e) {
        const status = (e as StatusError)?.status;
        switch(status) {
            case 413: {
                return NextResponse.json({ error: errors[413].message }, { status });
            }
            case 415: {
                return NextResponse.json({ error: errors[415].message });
            }
            case 504: {
                return NextResponse.json({ error: errors[504].message }, { status });
            }
            case 500:
            default:
                return NextResponse.json({ error: errors[500].message }, { status });
        }

    }

    // preserve original cache-control headers
    const responseHeaders = {
        'Cache-Control': resourceHeaders.get('cache-control') ?? 'no-cache',
        'Content-Length': resourceHeaders.get('content-length') as string, // cast type as there is no chance at this point content-length be absent,
        'Content-Type': resourceHeaders.get('content-type') ?? 'application/json, charset=utf-8',
        Etag: resourceHeaders.get('etag') ?? 'no-etag',
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
        return NextResponse.json({
            error: errors[415].message,
        }, { status: 415 });
    }
}
