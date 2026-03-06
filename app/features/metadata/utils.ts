import { parseUrl, SAFE_EXTERNAL_PROTOCOLS } from '@/app/shared/lib/url';

const IPFS_GATEWAY = 'https://ipfs.io/ipfs';

export const getProxiedUri = (uri: string): string | '' => {
    if (!uri) return '';

    // A malformed URI (unparseable on-chain data) is returned unchanged rather
    // than thrown: callers like ProxiedImage render this result inline and
    // outside an error boundary, so throwing here would crash the whole
    // surrounding card over a single bad logoURI. Passing it through lets the
    // <img>/anchor fail gracefully on its own, same as an unproxied URI.
    let url = parseUrl(uri);
    if (!url) return uri;

    const isProxyEnabled = process.env.NEXT_PUBLIC_METADATA_ENABLED === 'true';

    if (url.protocol === 'ipfs:') {
        const gatewayUri = resolveIpfsUri(url);
        return isProxyEnabled ? proxyUri(gatewayUri) : gatewayUri;
    }

    if (!isProxyEnabled) return uri;

    // Non-http(s) schemes aren't proxied (the proxy only fetches http(s)); pass
    // them through unchanged so the caller can decide what to do with them.
    if (!SAFE_EXTERNAL_PROTOCOLS.includes(url.protocol)) return uri;

    return proxyUri(uri);
};

const resolveIpfsUri = (url: URL): string => {
    // eslint-disable-next-line no-restricted-syntax -- Strips redundant "ipfs/" prefix from the path for a clean gateway URL.
    const path = (url.host + url.pathname).replace(/^ipfs\//, '');
    return `${IPFS_GATEWAY}/${path}${url.search}`;
};

const proxyUri = (uri: string): string => `/api/metadata/proxy?uri=${encodeURIComponent(uri)}`;