const UPSTREAM_TIMEOUT_MS = 30_000;

// Passing a signal opts out of Next.js's dedupe-fetch wrapper (calls
// response.body.tee() on every GET). Some upstream gzip/chunked bodies yield
// a body undici can't tee — throws "body.tee is not a function".
export function fetchUpstream(url: string, init?: RequestInit): Promise<Response> {
    return fetch(url, {
        ...init,
        signal: init?.signal ?? AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
}

// AbortSignal.timeout rejects with a DOMException named 'TimeoutError'.
// https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static#exceptions
export function isTimeoutError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'TimeoutError';
}
