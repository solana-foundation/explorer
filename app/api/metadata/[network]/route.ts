import { NextResponse } from 'next/server';
import { Headers } from 'node-fetch';

import { fetchResource, StatusError } from './feature';

type Params = {
    params: {
        // bypass network as we might apply caching strategy according the target chain later
        network: string
    }
}

const USER_AGENT = process.env.NEXT_PUBLIC_METADATA_USER_AGENT ?? 'Solana Explorer';
const MAX_SIZE = process.env.NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE ? Number(process.env.NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE) : 100_000; // 100 000 bytes
const TIMEOUT = process.env.NEXT_PUBLIC_METADATA_TIMEOUT ? Number(process.env.NEXT_PUBLIC_METADATA_TIMEOUT) : 10_000; // 10s


export async function GET(
    request: Request,
    { params: { network: _network } }: Params,
) {
    const isProxyEnabled = process.env.NEXT_PUBLIC_METADATA_ENABLED === 'true';

    if (!isProxyEnabled) {
        return NextResponse.json({ error: 'Page Not Found' }, { status: 404 });
    }

    let uriParam: string;
    try {
        const url = new URL(request.url);
        const queryParam = url.searchParams.get('uri');

        if (!queryParam) {
            throw new Error('Absent URI');
        }

        uriParam = decodeURI(queryParam);
    } catch(_e) {
        return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 });
    }

    const headers = new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': USER_AGENT
    });

    let data;
    let responseHeaders: Headers;

    try {
        const response = await fetchResource(uriParam, headers, TIMEOUT, MAX_SIZE);

        data = response.data;
        responseHeaders = response.headers;
    } catch(e: unknown) {
        let status = (e as StatusError)?.status;
        switch(status) {
            case 413: {
                return NextResponse.json({ error: 'Max content size exceeded' }, { status })
            }
            case 504: {
                return NextResponse.json({ error: 'Request Timeout' }, { status })
            }
            case 500:
            default:
                return NextResponse.json({ error: 'General Error' }, { status })
        }

    }

    // preserve original cache-control headers
    return NextResponse.json(data, {
        headers: {
            'Cache-Control': responseHeaders.get('cache-control') ?? 'no-cache',
            'Content-Length': responseHeaders.get('content-length') as string, // cast type as there is no chance at this point content-length be absent,
            'Content-Type': responseHeaders.get('content-type') ?? 'application/json, charset=utf-8',
            'Etag': responseHeaders.get('etag') ?? 'no-etag',
        }
    });
}
