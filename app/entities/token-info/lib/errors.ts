import { isRetryableFetchError } from '@shared/lib/errors';

type HttpErrorDetails = {
    status: number;
    statusText: string;
};

export class TokenInfoHttpError extends Error {
    readonly status: number;
    readonly statusText: string;

    constructor({ status, statusText }: HttpErrorDetails, options?: ErrorOptions) {
        super(`HTTP ${status}: ${statusText}`, options);
        this.name = 'TokenInfoHttpError';
        this.status = status;
        this.statusText = statusText;
    }
}

export class TokenInfoInvalidResponseError extends Error {
    constructor(message: string = 'Invalid response: missing content', options?: ErrorOptions) {
        super(message, options);
        this.name = 'TokenInfoInvalidResponseError';
    }
}

export function isTransientError(error: unknown): boolean {
    if (error instanceof TokenInfoHttpError) return error.status === 429 || error.status >= 500;
    if (!(error instanceof Error)) return false;
    if (error.name === 'TimeoutError' || error.name === 'AbortError') return true;
    return isRetryableFetchError(error);
}
