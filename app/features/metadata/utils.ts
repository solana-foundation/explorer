export const getProxiedUri = (uri: string): string | '' => {
    const isProxyEnabled = process.env.NEXT_PUBLIC_METADATA_ENABLED === 'true';

    if (!isProxyEnabled) return uri;

    // handle empty addresses as that is likely the case for metadata
    if (uri === '') return '';

    let url: URL;
    try {
        url = new URL(uri);
    } catch {
        throw new Error(`Could not construct URL for "${uri}"`);
    }

    if (!['http:', 'https:'].includes(url.protocol)) return uri;

    return `/api/metadata/proxy?uri=${encodeURIComponent(uri)}`;
};
