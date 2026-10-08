// Metadata URLs are on-chain data, so this module must not run on the server.
import 'client-only';

import { IPFS_PROTOCOL } from '@/app/shared/lib/ipfs';
import { getProxiedUri } from '@/app/shared/lib/proxied-uri';
import { ROUTE_TIMEOUT_MS } from '@/app/shared/lib/timeouts';
import { parseUrl, SAFE_EXTERNAL_PROTOCOLS } from '@/app/shared/lib/url';

import { type NftokenMetadataAnswer, parseNftokenMetadata } from '../lib/nftoken-metadata';

export async function fetchNftokenMetadata(uri: string): Promise<NftokenMetadataAnswer> {
    const requestUri = isFetchable(uri) ? getProxiedUri(uri) : '';
    if (!requestUri) return { kind: 'unavailable' };

    const response = await fetch(requestUri, { cache: 'no-store', signal: AbortSignal.timeout(ROUTE_TIMEOUT_MS) });
    if (isTransient(response.status)) throw new Error(`NFToken metadata fetch failed: ${response.status}`);
    if (!response.ok) return { kind: 'unavailable' };

    let json: unknown;
    try {
        json = await response.json();
    } catch (error) {
        if (error instanceof SyntaxError) return { kind: 'unavailable' };
        throw error;
    }
    return parseNftokenMetadata(json);
}

const FETCHABLE_PROTOCOLS = [...SAFE_EXTERNAL_PROTOCOLS, IPFS_PROTOCOL];

function isFetchable(uri: string): boolean {
    const url = parseUrl(uri);
    return Boolean(url && FETCHABLE_PROTOCOLS.includes(url.protocol));
}

const REQUEST_TIMEOUT = 408;
const RATE_LIMITED = 429;
const BAD_GATEWAY = 502;

function isTransient(status: number): boolean {
    return status === REQUEST_TIMEOUT || status === RATE_LIMITED || (status >= 500 && status !== BAD_GATEWAY);
}
