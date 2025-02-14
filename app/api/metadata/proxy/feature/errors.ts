export class StatusError extends Error {
    status: number;
    constructor(message: string, options: ErrorOptions & { cause: number }) {
        super(message);
        this.status = options.cause;
    }
}

export const invalidRequestError = new StatusError('Invalid Request', { cause: 400 });

export const accessDeniedError = new StatusError('Access Denied', { cause: 403 });

export const resourceNotFoundError = new StatusError('Resource Not Found', { cause: 404 });

export const maxSizeError = new StatusError('Max Content Size Exceeded', { cause: 413 });

export const unsupportedMediaError = new StatusError('Unsupported Media Type', { cause: 415 });

export const generalError = new StatusError('General Error', { cause: 500 });

export const gatewayTimeoutError = new StatusError('Gateway Timeout', { cause: 504 });

export const errors = {
    400: invalidRequestError,
    403: accessDeniedError,
    404: resourceNotFoundError,
    413: maxSizeError,
    415: unsupportedMediaError,
    500: generalError,
    504: gatewayTimeoutError,
};

export function matchAbortError(error: unknown): error is Error {
    return Boolean(error instanceof Error && error.name === 'AbortError');
}

export function matchMaxSizeError(error: unknown): error is Error {
    return Boolean(error instanceof Error && error.message.match(/over limit:/));
}

export function matchTimeoutError(error: unknown): error is Error {
    return Boolean(error instanceof Error && error.name === 'TimeoutError');
}
