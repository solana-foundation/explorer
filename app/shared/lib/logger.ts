import { captureException, captureMessage } from '@sentry/nextjs';

enum LOG_LEVEL {
    PANIC,
    ERROR,
    WARN,
    INFO,
    DEBUG,
}

type PanicContext = Record<string, unknown> & {
    error: unknown;
    hint?: Parameters<typeof captureException>[1];
};

type SentryContext = Record<string, unknown> & {
    /** When true, the message is also sent to Sentry via captureMessage. */
    sentry?: boolean;
};

/**
 * A log message won't be shown if its level is greater than the NEXT_LOG_LEVEL environment variable.
 *
 * All methods use a uniform signature: (message: string, context?: Record<string, unknown>)
 * - Tags are inline in the message: `[module]` or `[section:module]`
 * - Dynamic values go in the context object for searchable stable messages
 * - Errors go in context as `{ error }` — formatArgs extracts them as separate console arguments
 *   to preserve stack traces in Vercel
 */
class StraightforwardLogger {
    panic(message: string, context: PanicContext) {
        // Sentry capture is intentionally not gated by isLoggable — panics must
        // always reach error tracking regardless of the console log level.
        // Libraries and boundary code (try/catch of unknown, promise rejections, fetch
        // failures) can surface non-Error values — strings, numbers, null, or plain
        // objects. Sentry groups and tracks real Error instances far better (stack traces,
        // deduplication), so we wrap non-Error values to preserve that behavior.
        const error = context.error instanceof Error ? context.error : new Error(String(context.error));
        captureException(error, context.hint);
        isLoggable(LOG_LEVEL.PANIC) && console.error(...formatArgs(message, context));
    }
    error(message: string, context?: SentryContext) {
        if (context?.sentry) {
            captureMessage(message, 'error');
        }
        isLoggable(LOG_LEVEL.ERROR) && console.error(...formatArgs(message, context));
    }
    warn(message: string, context?: SentryContext) {
        if (context?.sentry) {
            captureMessage(message, 'warning');
        }
        isLoggable(LOG_LEVEL.WARN) && console.warn(...formatArgs(message, context));
    }
    info(message: string, context?: Record<string, unknown>) {
        isLoggable(LOG_LEVEL.INFO) && console.info(...formatArgs(message, context));
    }
    debug(message: string, context?: Record<string, unknown>) {
        isLoggable(LOG_LEVEL.DEBUG) && console.debug(...formatArgs(message, context));
    }
}

export const Logger = new StraightforwardLogger();

/**
 * Determines if a log message should be output based on its level and the current logging threshold.
 *
 * Compares the expected log level against the NEXT_LOG_LEVEL environment variable.
 * Lower numbers have higher priority (e.g., PANIC=0, ERROR=1, WARN=2, INFO=3, DEBUG=4).
 *
 * @param expectedLevel - The log level of the message to be logged
 * @returns True if the message should be logged, false otherwise.
 *          **All logging is suppressed when NEXT_LOG_LEVEL is not set.**
 *
 * @example
 * // With NEXT_LOG_LEVEL=3 (INFO level)
 * isLoggable(LOG_LEVEL.ERROR)  // returns true (1 <= 3)
 * isLoggable(LOG_LEVEL.DEBUG)  // returns false (4 > 3)
 */
function isLoggable(expectedLevel: LOG_LEVEL) {
    const currentLevel = process.env.NEXT_LOG_LEVEL ? parseInt(process.env.NEXT_LOG_LEVEL) : undefined;

    function isNullish(value: unknown): value is null | undefined {
        return value === null || value === undefined;
    }

    // do not log if expected level is greater than current one
    return !isNullish(currentLevel) && Number.isFinite(currentLevel) && expectedLevel <= currentLevel;
}

/**
 * Builds console arguments from a message and optional context object.
 * Extracts `error` from context and passes it as a separate argument to preserve stack traces.
 */
function formatArgs(message: string, context?: Record<string, unknown>): unknown[] {
    if (!context) return [message];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { error, hint: _hint, sentry: _sentry, ...rest } = context;
    const args: unknown[] = [message];

    if (Object.keys(rest).length > 0) {
        args.push(rest);
    }

    if (error !== undefined) {
        args.push(error);
    }

    return args;
}
