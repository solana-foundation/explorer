import { UTL_API_TIMEOUT_MS } from '../env';

export function createAbortSignal(timeoutMs: number = UTL_API_TIMEOUT_MS): AbortSignal {
    return AbortSignal.timeout(timeoutMs);
}
