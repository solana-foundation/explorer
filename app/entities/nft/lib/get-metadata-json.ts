import type { Metadata } from '@metaplex-foundation/mpl-token-metadata';

import { getProxiedUri } from '@/app/features/metadata/utils';

import type { NftJson } from './types';

export type GetMetadataJsonDeps = {
    onError?: (error: unknown) => void;
    /**
     * Absolute origin used to resolve a root-relative proxy path.
     * `getProxiedUri` returns `/api/metadata/proxy?uri=...` when the proxy is
     * enabled, and `fetch` only accepts a relative path in the browser. Server
     * callers must pass their own request origin.
     */
    baseUrl?: string;
    /** Aborts the off-chain JSON request. Server callers use it to bound the wait. */
    signal?: AbortSignal;
};

// eslint-disable-next-line no-restricted-syntax -- match image data URI mime types
const IMAGE_MIME_TYPE_REGEX = /data:image\/(svg\+xml|png|jpeg|gif)/;

/**
 * Makes a proxied URI fetchable. The browser resolves a root-relative path
 * against the current page, so it is returned unchanged when no `baseUrl` is
 * given.
 */
function resolveRequestUri(proxiedUri: string, baseUrl?: string): string {
    if (!baseUrl || !proxiedUri.startsWith('/')) return proxiedUri;
    return new URL(proxiedUri, baseUrl).toString();
}

/**
 * Resolves an image path against the metadata URI and drops payloads that carry
 * no artwork at all.
 */
function processJson(extended: any, uri: string): NftJson | undefined {
    if (!extended || (!extended.image && extended?.properties?.files?.length === 0)) {
        return undefined;
    }

    if (extended?.image) {
        extended.image =
            extended.image.startsWith('http') || IMAGE_MIME_TYPE_REGEX.test(extended.image)
                ? extended.image
                : `${uri}/${extended.image}`;
    }

    return extended;
}

export async function getMetadataJson(metadata: Metadata, deps?: GetMetadataJsonDeps): Promise<NftJson | undefined> {
    const uri = metadata.uri;
    if (!uri) return undefined;

    // Building the request URI is synchronous, and a failure means bad input (a malformed
    // `baseUrl`), so it is reported to the caller.
    let requestUri: string;
    try {
        requestUri = resolveRequestUri(getProxiedUri(uri), deps?.baseUrl);
    } catch (error) {
        deps?.onError?.(error);
        return undefined;
    }

    // A dead link, a timeout, or an unparseable body is an everyday outcome for third-party
    // metadata. Those stay quiet: the NFT page maps `onError` to `Logger.error`, so reporting them
    // would escalate the ordinary case.
    try {
        const response = await fetch(requestUri, { signal: deps?.signal });
        return processJson(await response.json(), uri);
    } catch {
        return undefined;
    }
}
