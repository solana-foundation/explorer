enum LOG_LEVEL {
    PANIC,
    ERROR,
    WARN,
    INFO,
    DEBUG,
}

/**
 * Determines if a log message should be output based on its level and the current logging threshold.
 *
 * Compares the expected log level against the NEXT_LOG_LEVEL environment variable.
 * Lower numbers have higher priority (e.g., PANIC=0, ERROR=1, WARN=2, INFO=3, DEBUG=4).
 *
 * @param expectedLevel - The log level of the message to be logged
 * @returns True if the message should be logged, false otherwise. Returns false if NEXT_LOG_LEVEL is not set or invalid.
 *
 * @example
 * // With NEXT_LOG_LEVEL=3 (INFO level)
 * isLoggable(LOG_LEVEL.ERROR)  // returns true (1 <= 3)
 * isLoggable(LOG_LEVEL.DEBUG)  // returns false (4 > 3)
 */
function isLoggable(expectedLevel: LOG_LEVEL) {
    const currentLevel = process.env.NEXT_LOG_LEVEL ? parseInt(process.env.NEXT_LOG_LEVEL) : undefined;

    function isNullish(value: any): value is null | undefined {
        return value === null || value === undefined;
    }

    // do not log if expected level is greater than current one
    return !isNullish(currentLevel) && Number.isFinite(currentLevel) && expectedLevel <= currentLevel;
}

/**
 * A log message won't be shown if its level is greater than the NEXT_LOG_LEVEL environment variable.
 */
export default class StraightforwardLogger {
    static panic(error: Error, ...context: unknown[]) {
        isLoggable(LOG_LEVEL.PANIC) && console.error(error, ...context);
    }
    static error(error: Error, ...context: unknown[]): void;
    static error(maybeError: unknown, ...context: unknown[]): void;
    static error(maybeError: unknown, ...other: unknown[]) {
        let error;
        if (maybeError instanceof Error) {
            error = maybeError;
        } else {
            error = new Error('Unrecognized error');
            isLoggable(LOG_LEVEL.DEBUG) && console.debug(maybeError);
        }
        isLoggable(LOG_LEVEL.ERROR) && console.error(error, ...other);
    }
    static warn(message: unknown, ...other: unknown[]) {
        isLoggable(LOG_LEVEL.WARN) && console.warn(message, ...other);
    }
    static info(message: unknown, ...other: unknown[]) {
        isLoggable(LOG_LEVEL.INFO) && console.info(message, ...other);
    }
    static debug(message: unknown, ...other: unknown[]) {
        isLoggable(LOG_LEVEL.DEBUG) && console.debug(message, ...other);
    }
}
