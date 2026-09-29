// What failed, so the caller can pick a log policy without parsing messages.
export type ProxyErrorCode =
    | 'aborted'
    | 'decode-failed'
    | 'malformed-json'
    | 'non-http-protocol'
    | 'oversize-declared'
    | 'oversize-streamed'
    | 'redirect-invalid-location'
    | 'redirect-loop'
    | 'redirect-missing-location'
    | 'ssrf-blocked'
    | 'timeout'
    | 'too-many-redirects'
    | 'unlisted-upstream-status'
    | 'unreachable'
    | 'unsupported-content-type'
    | 'upstream-status';

type StatusErrorOptions = ErrorOptions & {
    code: ProxyErrorCode;
    context?: Record<string, unknown>;
    retryAfter?: string;
};

// `status` is its own field so `cause` keeps its Error-chaining meaning for error reporters.
export class StatusError extends Error {
    status: StatusCode;
    code: ProxyErrorCode;
    context: Record<string, unknown>;
    // Upstream `Retry-After`, for the caller's retry policy; the proxy never retries.
    retryAfter?: string;
    constructor(message: string, options: StatusErrorOptions & { status: StatusCode }) {
        super(message, options);
        this.name = 'StatusError';
        this.status = options.status;
        this.code = options.code;
        this.context = options.context ?? {};
        this.retryAfter = options.retryAfter;
    }
}

// Canonical HTTP status text used for the proxy response body. Kept separate
// from returned errors on purpose — each failure site constructs a fresh
// StatusError with a site-specific message and `code`, while the client
// always sees the canonical text below.
export const STATUS_MESSAGES = {
    400: 'Invalid Request',
    403: 'Access Denied',
    404: 'Resource Not Found',
    410: 'Gone',
    413: 'Max Content Size Exceeded',
    415: 'Unsupported Media Type',
    429: 'Too Many Requests',
    451: 'Unavailable For Legal Reasons',
    500: 'General Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
} as const satisfies Record<number, string>;

export type StatusCode = keyof typeof STATUS_MESSAGES;

// `message` names the failing site; `logProxyError` logs it when `LOG_POLICY` has no message for the code.
export function statusError(status: StatusCode, message: string, options: StatusErrorOptions): StatusError {
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
