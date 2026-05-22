// `status` is a separate field (not `cause`) so that `cause` retains its
// standard Error-chaining semantics and error reporters can walk the chain.
export class StatusError extends Error {
    status: number;
    constructor(message: string, options: ErrorOptions & { status: number }) {
        super(message, options);
        this.status = options.status;
    }
}

export const invalidRequestError = new StatusError('Invalid Request', { status: 400 });

export const accessDeniedError = new StatusError('Access Denied', { status: 403 });

export const resourceNotFoundError = new StatusError('Resource Not Found', { status: 404 });

export const maxSizeError = new StatusError('Max Content Size Exceeded', { status: 413 });

export const unsupportedMediaError = new StatusError('Unsupported Media Type', { status: 415 });

export const generalError = new StatusError('General Error', { status: 500 });

export const badGatewayError = new StatusError('Bad Gateway', { status: 502 });

export const gatewayTimeoutError = new StatusError('Gateway Timeout', { status: 504 });

export const errors = {
    400: invalidRequestError,
    403: accessDeniedError,
    404: resourceNotFoundError,
    413: maxSizeError,
    415: unsupportedMediaError,
    500: generalError,
    502: badGatewayError,
    504: gatewayTimeoutError,
};

export function matchMaxSizeError(error: unknown): error is Error {
    // eslint-disable-next-line no-restricted-syntax -- pattern matching for error message detection
    return Boolean(error instanceof Error && error.message.match(/over limit:/));
}

export function matchTimeoutError(error: unknown): error is Error {
    return Boolean(error instanceof Error && error.name === 'TimeoutError');
}

export function matchAbortError(error: unknown): error is Error {
    return Boolean(error instanceof Error && error.name === 'AbortError');
}
