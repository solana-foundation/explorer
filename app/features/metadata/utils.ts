export const getProxiedUri = (uri: string): string => {
    const isProxyEnabled = process.env.NEXT_PUBLIC_METADATA_ENABLED === 'true';

    if (!isProxyEnabled) return uri;

    const url = new URL(uri);

    if (!["http:", "https:"].includes(url.protocol)) return uri;

    return `/api/metadata/proxy?uri=${encodeURIComponent(uri)}`;
};
