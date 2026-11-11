import { JUPITER_TOKENS_TIMEOUT_MS } from '../env';

export function createAbortSignal(timeoutMs: number = JUPITER_TOKENS_TIMEOUT_MS): AbortSignal {
    return AbortSignal.timeout(timeoutMs);
}
