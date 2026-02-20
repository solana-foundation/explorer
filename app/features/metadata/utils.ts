export const getProxiedUri = (uri: string): string | '' => {
    // handle empty addresses as that is likely the case for metadata
    if (uri === '') return '';

    let url: URL;
    try {
        url = new URL(uri);
    } catch {
        throw new Error(`Could not construct URL for "${uri}"`);
    }

    if (url.protocol === 'ipfs:') {
        let path = url.host + url.pathname;
        if (path.startsWith('ipfs/')) {
            path = path.replace(/^ipfs\//, '');
        }
        uri = `https://ipfs.io/ipfs/${path}${url.search}`;
        try {
            url = new URL(uri);
        } catch {
            // Should not happen, but safe fallback
        }
    }

    const isProxyEnabled = process.env.NEXT_PUBLIC_METADATA_ENABLED === 'true';

    if (!isProxyEnabled) return uri;

    if (!['http:', 'https:'].includes(url.protocol)) return uri;

    return `/api/metadata/proxy?uri=${encodeURIComponent(uri)}`;
};
