import { IPFS_PROTOCOL, resolveIpfsUri } from '@/app/shared/lib/ipfs';
import { parseUrl, SAFE_EXTERNAL_PROTOCOLS } from '@/app/shared/lib/url';

export const getProxiedUri = (uri: string): string | '' => {
    if (!uri) return '';

    const url = parseUrl(uri);
    if (!url) return uri;

    const isProxyEnabled = process.env.NEXT_PUBLIC_METADATA_ENABLED === 'true';

    if (url.protocol === IPFS_PROTOCOL) {
        const gatewayUri = resolveIpfsUri(url);
        if (gatewayUri === '') return '';
        return isProxyEnabled ? proxyUri(gatewayUri) : gatewayUri;
    }

    if (!isProxyEnabled) return uri;

    if (!SAFE_EXTERNAL_PROTOCOLS.includes(url.protocol)) return uri;

    return proxyUri(uri);
};

const proxyUri = (uri: string): string => `/api/metadata/proxy?uri=${encodeURIComponent(uri)}`;
