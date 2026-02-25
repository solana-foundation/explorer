const IPFS_GATEWAY = 'https://ipfs.io/ipfs';

export const getProxiedUri = (uri: string): string | '' => {
    // handle empty addresses as that is likely the case for metadata
    if (uri === '') return '';

    let url: URL;
    try {
        url = new URL(uri);
    } catch {
        throw new Error(`Could not construct URL for "${uri}"`);
    }

    const isProxyEnabled = process.env.NEXT_PUBLIC_METADATA_ENABLED === 'true';

    if (url.protocol === 'ipfs:') {
        const gatewayUri = resolveIpfsUri(url);
        return isProxyEnabled ? proxyUri(gatewayUri) : gatewayUri;
    }

    if (!isProxyEnabled) return uri;

    if (!['http:', 'https:'].includes(url.protocol)) return uri;

    return proxyUri(uri);
};

const resolveIpfsUri = (url: URL): string => {
    const path = (url.host + url.pathname).replace(/^ipfs\//, '');
    return `${IPFS_GATEWAY}/${path}${url.search}`;
};

const proxyUri = (uri: string): string => `/api/metadata/proxy?uri=${encodeURIComponent(uri)}`