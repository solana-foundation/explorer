import type { Metadata } from '@metaplex-foundation/mpl-token-metadata';

import { getProxiedUri } from '@/app/features/metadata/utils';

import type { NftJson } from './types';

export type GetMetadataJsonDeps = {
    onError?: (error: unknown) => void;
};

// eslint-disable-next-line no-restricted-syntax -- match image data URI mime types
const IMAGE_MIME_TYPE_REGEX = /data:image\/(svg\+xml|png|jpeg|gif)/;

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

/**
 * Reads an NFT's off-chain JSON in the browser.
 *
 * Browser-only by design. `getProxiedUri` returns a root-relative `/api/metadata/proxy` path
 * that only the browser can resolve, and when proxying is disabled it returns the raw
 * attacker-controlled on-chain URI — fine to fetch from the user's own network, not from ours.
 * Server callers read off-chain metadata through the proxy's `fetchResource` in process
 * instead; see `entities/token-info/api/fetch-token-metaplex.ts`.
 */
export async function getMetadataJson(metadata: Metadata, deps?: GetMetadataJsonDeps): Promise<NftJson | undefined> {
    const uri = metadata.uri;
    if (!uri) return undefined;

    // Building the request URI is synchronous, and a failure means bad input, so it is reported.
    let requestUri: string;
    try {
        requestUri = getProxiedUri(uri);
    } catch (error) {
        deps?.onError?.(error);
        return undefined;
    }

    // A dead link, a timeout, or an unparseable body is an everyday outcome for third-party
    // metadata. Those stay quiet: the NFT page maps `onError` to `Logger.error`, so reporting them
    // would escalate the ordinary case.
    try {
        const response = await fetch(requestUri);
        // The proxy answers a blocked, dead or oversize URI with a JSON error body, and an
        // upstream can serve its own JSON error page. Neither is metadata, and `processJson`
        // would pass such a body through: it only rejects a payload that names no artwork.
        if (!response.ok) return undefined;
        return processJson(await response.json(), uri);
    } catch {
        return undefined;
    }
}
