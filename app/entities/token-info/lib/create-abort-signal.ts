export function createAbortSignal(timeoutMs: number = JUPITER_TOKENS_TIMEOUT_MS): AbortSignal {
    return AbortSignal.timeout(timeoutMs);
}

const JUPITER_TOKENS_TIMEOUT_MS = 5_000;
