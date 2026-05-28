const HTTP_DELAY_MS = 300;
const HTTP_TIMEOUT_MS = 15_000;

/**
 * Fetch a URL as text, returning `undefined` (rather than throwing) on any
 * network error or non-2xx status. Sleeps briefly after each successful read
 * to stay polite to the upstream host.
 */
export async function fetchText(url: string): Promise<string | undefined> {
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(HTTP_TIMEOUT_MS) });
        if (!response.ok) {
            console.warn(`  ! failed to fetch ${url}: HTTP ${response.status}`);
            return undefined;
        }
        const body = await response.text();
        await delay(HTTP_DELAY_MS);
        return body;
    } catch (error) {
        console.warn(`  ! failed to fetch ${url}: ${describeError(error)}`);
        return undefined;
    }
}

export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function describeError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
