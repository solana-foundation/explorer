export function matchAbortError(error: unknown): error is Error {
    return Boolean(error instanceof Error && error.name === 'AbortError');
}
