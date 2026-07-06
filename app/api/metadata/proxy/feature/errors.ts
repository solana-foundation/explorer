// `status` is a separate field (not `cause`) so that `cause` retains its
// standard Error-chaining semantics and error reporters can walk the chain.
export class StatusError extends Error {
    status: number;
    constructor(message: string, options: ErrorOptions & { status: number }) {
        super(message, options);
        this.name = 'StatusError';
        this.status = options.status;
    }
}

// Canonical HTTP status text used for the proxy response body. Kept separate
// from thrown errors on purpose — each throw site constructs a fresh
// StatusError with a site-specific message (so Sentry/Logger can distinguish
// "too many redirects" from "redirect loop" from "non-2xx upstream"), while
// the client always sees the canonical text below.
export const STATUS_MESSAGES = {
    400: 'Invalid Request',
    403: 'Access Denied',
    404: 'Resource Not Found',
    413: 'Max Content Size Exceeded',
    415: 'Unsupported Media Type',
    500: 'General Error',
    502: 'Bad Gateway',
    504: 'Gateway Timeout',
} as const satisfies Record<number, string>;

export type StatusCode = keyof typeof STATUS_MESSAGES;

// Factory — fresh stack trace per call, optional `cause` for chaining.
// Use `message` to describe what went wrong at this throw site (logged +
// preserved in the Error chain); the response body comes from STATUS_MESSAGES.
export function statusError(status: StatusCode, message: string, options?: ErrorOptions): StatusError {
    return new StatusError(message, { ...options, status });
}

export function matchMaxSizeError(error: unknown): error is Error {
    // eslint-disable-next-line no-restricted-syntax -- pattern matching for error message detection
    return Boolean(error instanceof Error && error.message.match(/over limit:/));
}

export function matchTimeoutError(error: unknown): error is Error {
    return Boolean(error instanceof Error && error.name === 'TimeoutError');
}

// TODO: duplicates `matchAbortError` in @shared/lib/errors — consolidate onto the shared one.
export function matchAbortError(error: unknown): error is Error {
    return Boolean(error instanceof Error && error.name === 'AbortError');
}
