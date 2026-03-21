import { parseUrl, SAFE_EXTERNAL_PROTOCOLS } from '@/app/shared/lib/url';
import Logger from '@utils/logger';
import { CID } from 'multiformats/cid';

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
        if (gatewayUri === '') return '';
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
    if (!verifyCID(path)) {
        Logger.warn(`[metadata] Cannot fetch a malformed CID: ${path}`);
        return '';
    }
    return `${IPFS_GATEWAY}/${path}${url.search}`;
};

const proxyUri = (uri: string): string => `/api/metadata/proxy?uri=${encodeURIComponent(uri)}`;

export const verifyCID = (cid: string): boolean => {
    try {
        CID.parse(cid);
        return true;
    } catch {
        return false;
    }
};