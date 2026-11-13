import 'server-only';

import { array, is } from 'superstruct';

import { fetchUpstream } from '@/app/shared/lib/http-utils';

import { TokenInfoHttpError, TokenInfoInvalidResponseError } from '../lib/errors';
import { JUPITER_TOKENS_SEARCH_URL, type JupiterToken, JupiterTokenStruct } from '../lib/jupiter-token';

type JupiterTokensSearchResult =
    { kind: 'resolved'; tokens: JupiterToken[]; malformed: number } | { kind: 'unavailable'; error: unknown };

export async function searchJupiterTokens({
    apiKey,
    query,
    revalidate,
    signal,
}: {
    apiKey: string;
    query: string;
    revalidate?: number;
    signal?: AbortSignal;
}): Promise<JupiterTokensSearchResult> {
    try {
        const response = await fetchUpstream(`${JUPITER_TOKENS_SEARCH_URL}?query=${encodeURIComponent(query)}`, {
            headers: { Accept: 'application/json', 'x-api-key': apiKey },
            ...(revalidate === undefined ? {} : { next: { revalidate } }),
            signal,
        });

        if (!response.ok) {
            const error = new TokenInfoHttpError({ status: response.status, statusText: response.statusText });
            return { error, kind: 'unavailable' };
        }

        const data: unknown = await response.json();
        if (!is(data, array())) return { error: new TokenInfoInvalidResponseError(), kind: 'unavailable' };

        const tokens = data.filter(entry => is(entry, JupiterTokenStruct));
        return { kind: 'resolved', malformed: data.length - tokens.length, tokens };
    } catch (error) {
        return { error, kind: 'unavailable' };
    }
}
