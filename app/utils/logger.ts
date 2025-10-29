enum LOG_LEVEL {
    ERROR,
    WARN,
    INFO,
    DEBUG,
}

/**
 * Determines if a log message should be output based on its level and the current logging threshold.
 *
 * Compares the expected log level against the NEXT_LOG_LEVEL environment variable.
 * Lower numbers have higher priority (e.g., ERROR=0, WARN=1, INFO=2, DEBUG=3).
 *
 * @param expectedLevel - The log level of the message to be logged
 * @returns True if the message should be logged, false otherwise. Returns false if NEXT_LOG_LEVEL is not set or invalid.
 *
 * @example
 * // With NEXT_LOG_LEVEL=2 (INFO level)
 * isLoggable(LOG_LEVEL.ERROR)  // returns true (0 <= 2)
 * isLoggable(LOG_LEVEL.DEBUG)  // returns false (3 > 2)
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
    static error(maybeError: any, ...other: any[]) {
        let error;
        if (maybeError instanceof Error) {
            error = maybeError;
        } else {
            error = new Error('Unrecognized error');
            isLoggable(3) && console.debug(maybeError);
        }
        isLoggable(0) && console.error(error, ...other);
    }
    static debug(message: any, ...other: any[]) {
        isLoggable(3) && console.debug(message, ...other);
    }
}
