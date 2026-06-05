import { parseUrl, SAFE_EXTERNAL_PROTOCOLS } from '@/app/shared/lib/url';

export const getProxiedUri = (uri: string): string | '' => {
    const isProxyEnabled = process.env.NEXT_PUBLIC_METADATA_ENABLED === 'true';

    if (!isProxyEnabled) return uri;

    if (!uri) return '';

    const url = parseUrl(uri);
    if (!url) {
        throw new Error(`Could not construct URL for "${uri}"`);
    }

    // Non-http(s) schemes aren't proxied (the proxy only fetches http(s)); pass
    // them through unchanged so the caller can decide what to do with them.
    if (!SAFE_EXTERNAL_PROTOCOLS.includes(url.protocol)) return uri;

    return `/api/metadata/proxy?uri=${encodeURIComponent(uri)}`;
};
