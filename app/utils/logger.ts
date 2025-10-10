export enum LOG_LEVEL {
    ERROR,
    WARN,
    INFO,
    DEBUG,
}

function isLoggable(expectedLevel: LOG_LEVEL) {
    const currentLevel = process.env.NEXT_LOG_LEVEL ? parseInt(process.env.NEXT_LOG_LEVEL) : undefined;

    function isNullish(value: any): value is null | undefined {
        return value === null || value === undefined;
    }

    // do not log if expected level is greater than current one
    return !isNullish(currentLevel) && Number.isFinite(currentLevel) && expectedLevel <= currentLevel;
}

export function toError(maybeError: any) {
    let error: Error;
    let originalError;
    if (maybeError instanceof Error) {
        error = maybeError;
    } else {
        error = new Error('Unrecognized error');
        originalError = maybeError;
    }
    return { error, originalError };
}

export default class StraightforwardLogger {
    static error(maybeError: any, ...other: any[]) {
        let error;
        if (maybeError instanceof Error) {
            error = maybeError;
        } else {
            error = new Error('Unrecognized error');
            isLoggable(LOG_LEVEL.DEBUG) && console.debug(maybeError);
        }
        isLoggable(LOG_LEVEL.ERROR) && console.error(error, ...other);
    }
    static debug(message: any, ...other: any[]) {
        isLoggable(LOG_LEVEL.DEBUG) && console.debug(message, ...other);
    }
}
