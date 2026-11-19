import 'server-only';

import { array, validate } from 'superstruct';

import { fetchUpstream } from '@/app/shared/lib/http-utils';

import { JupiterHttpError } from '../lib/errors';
import {
    JUPITER_TOKENS_SEARCH_URL,
    JUPITER_VERIFIED_TOKENS_URL,
    type JupiterToken,
    JupiterTokenStruct,
} from '../lib/jupiter-token';

export type JupiterTokensResult =
    { kind: 'resolved'; tokens: JupiterToken[] } | { kind: 'rate-limited' } | { kind: 'unavailable'; error: unknown };

export function searchJupiterTokens({
    apiKey,
    query,
    revalidate,
    signal,
}: {
    apiKey: string;
    query: string;
    revalidate?: number;
    signal?: AbortSignal;
}): Promise<JupiterTokensResult> {
    return fetchJupiterTokens(`${JUPITER_TOKENS_SEARCH_URL}?query=${encodeURIComponent(query)}`, {
        apiKey,
        ...(revalidate === undefined ? {} : { next: { revalidate } }),
        signal,
    });
}

export function fetchJupiterVerifiedTokens({
    apiKey,
    signal,
}: {
    apiKey: string;
    signal: AbortSignal;
}): Promise<JupiterTokensResult> {
    // The list exceeds the item size limit of the Next data cache.
    return fetchJupiterTokens(JUPITER_VERIFIED_TOKENS_URL, { apiKey, cache: 'no-store', signal });
}

async function fetchJupiterTokens(
    url: string,
    { apiKey, ...init }: RequestInit & { apiKey: string },
): Promise<JupiterTokensResult> {
    try {
        const response = await fetchUpstream(url, {
            ...init,
            headers: { Accept: 'application/json', 'x-api-key': apiKey },
        });

        if (response.status === 429) return { kind: 'rate-limited' };
        if (!response.ok) {
            const error = new JupiterHttpError({ status: response.status, statusText: response.statusText });
            return { error, kind: 'unavailable' };
        }

        const data: unknown = await response.json();
        const [schemaError, tokens] = validate(data, array(JupiterTokenStruct));
        if (schemaError) return { error: schemaError, kind: 'unavailable' };

        return { kind: 'resolved', tokens };
    } catch (error) {
        return { error, kind: 'unavailable' };
    }
}
