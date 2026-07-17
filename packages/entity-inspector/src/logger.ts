type LogContext = Record<string, unknown>;

export type InspectorLogger = {
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
};

export const consoleLogger: InspectorLogger = {
    debug: (message, context) => (context ? console.debug(message, context) : console.debug(message)),
    info: (message, context) => (context ? console.info(message, context) : console.info(message)),
    warn: (message, context) => (context ? console.warn(message, context) : console.warn(message)),
};
