export const getProxiedUri = (uri: string): string => {
    const isProxyEnabled = process.env.NEXT_PUBLIC_METADATA_ENABLED === 'true';

    if (!isProxyEnabled) return uri;

    return `/api/metadata/proxy?uri=${encodeURI(uri)}`;
}
