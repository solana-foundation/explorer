export const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };
export const PROXY_TIMEOUT_MS = 10_000;

export function parseResponseBody(responseText: string) {
    if (!responseText) {
        return null;
    }

    try {
        return JSON.parse(responseText);
    } catch {
        return { error: responseText };
    }
}
