import { captureException } from '@sentry/nextjs';

import { toError } from './logger';
import { isSentryEnabled } from './logger/sentry';

export class SentryLogger {
    /**
     * "private" method to not rely onto Sentry's captureException implementation as it spams error upon hot-reloading
     */
    static _captureException(error: Error, originalError: any) {
        captureException(error, originalError ? { originalException: originalError } : undefined);
    }

    /**
     * Method to log an error, but send exception to Sentry
     */
    static error(maybeError: any) {
        // StraightforwardLogger.error(maybeError, ...other);
        const { error, originalError } = toError(maybeError);
        if (isSentryEnabled()) {
            SentryLogger._captureException(error, originalError);
        }
    }
}
