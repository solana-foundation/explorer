import { isRetryableFetchError, matchAbortError } from '@shared/lib/errors';
import { isTransientStatus } from '@shared/lib/http-status';
import { Logger } from '@shared/lib/logger';

type HttpErrorDetails = {
    status: number;
    statusText: string;
};

export class JupiterHttpError extends Error {
    readonly status: number;

    constructor({ status, statusText }: HttpErrorDetails) {
        super(`HTTP ${status}: ${statusText}`);
        this.name = 'JupiterHttpError';
        this.status = status;
    }
}

export function reportJupiterError({
    error,
    message,
    sentryExtras,
}: {
    error: unknown;
    message: string;
    sentryExtras?: Record<string, unknown>;
}): void {
    if (isTransientError(error)) {
        Logger.warn(message, {
            sentry: true,
            sentryExtras: { ...sentryExtras, upstreamError: error instanceof Error ? error.message : String(error) },
        });
        return;
    }
    Logger.error(new Error(message, { cause: error }), { sentry: true, sentryExtras });
}

export function isTransientError(error: unknown): boolean {
    if (error instanceof JupiterHttpError) return isTransientStatus(error.status);
    if (!(error instanceof Error)) return false;
    if (error.name === 'TimeoutError' || matchAbortError(error)) return true;
    return isRetryableFetchError(error);
}
