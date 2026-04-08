function normalizeBaseUrl(url: string) {
    return url.endsWith('/') ? url.slice(0, -1) : url;
}

function deriveSearchApiBaseUrlFromRpcUrl(rpcUrl: string) {
    try {
        const parsedUrl = new URL(rpcUrl);
        parsedUrl.hash = '';
        parsedUrl.search = '';

        const normalizedPath = parsedUrl.pathname.endsWith('/') ? parsedUrl.pathname.slice(0, -1) : parsedUrl.pathname;

        parsedUrl.pathname = normalizedPath ? `${normalizedPath}/api` : '/api';
        return normalizeBaseUrl(parsedUrl.toString());
    } catch {
        return `${normalizeBaseUrl(rpcUrl)}/api`;
    }
}

export function getHeliusApiKey() {
    return process.env.HELIUS_API_KEY ?? '';
}

export function getHeliusSearchApiBaseUrl() {
    const explicitBaseUrl = process.env.NEXT_PUBLIC_HELIUS_SEARCH_API_BASE_URL;
    if (explicitBaseUrl) {
        return normalizeBaseUrl(explicitBaseUrl);
    }

    const mainnetRpcUrl = process.env.MAINNET_RPC_URL ?? process.env.NEXT_PUBLIC_MAINNET_RPC_URL;
    if (!mainnetRpcUrl) {
        return '';
    }

    return deriveSearchApiBaseUrlFromRpcUrl(mainnetRpcUrl);
}
