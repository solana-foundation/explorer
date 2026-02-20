import { parseUrl, SAFE_EXTERNAL_PROTOCOLS } from '@/app/shared/lib/url';

export const getProxiedUri = (uri: string): string | '' => {
    if (!uri) return '';

    // A malformed URI (unparseable on-chain data) is returned unchanged rather
    // than thrown: callers like ProxiedImage render this result inline and
    // outside an error boundary, so throwing here would crash the whole
    // surrounding card over a single bad logoURI. Passing it through lets the
    // <img>/anchor fail gracefully on its own, same as an unproxied URI.
    let url = parseUrl(uri);
    if (!url) return uri;

    if (url.protocol === 'ipfs:') {
        let path = url.host + url.pathname;
        if (path.startsWith('ipfs/')) {
            path = path.replace(/^ipfs\//, '');
        }
        uri = `https://ipfs.io/ipfs/${path}${url.search}`;
        url = parseUrl(uri) || url;
    }

    const isProxyEnabled = process.env.NEXT_PUBLIC_METADATA_ENABLED === 'true';

    if (!isProxyEnabled) return uri;

    // Non-http(s) schemes aren't proxied (the proxy only fetches http(s)); pass
    // them through unchanged so the caller can decide what to do with them.
    if (!SAFE_EXTERNAL_PROTOCOLS.includes(url.protocol)) return uri;

    return `/api/metadata/proxy?uri=${encodeURIComponent(uri)}`;
};
