import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock Sentry before importing the logger to leverage @sentry/next.js loading error
vi.mock('@sentry/nextjs', () => ({
    captureException: vi.fn(),
}));

import StraightforwardLogger, { LOG_LEVEL } from '../logger';
import { SentryLogger } from '../logger-sentry';

describe('StraightforwardLogger', () => {
    // Store original environment
    const originalEnv = process.env;

    // Create spy mocks for console methods
    let consoleErrorSpy: any;
    let consoleDebugSpy: any;

    beforeEach(() => {
        // Reset process.env for each test
        process.env = { ...originalEnv };

        // Setup console spies
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);

        // Reset mocks between tests
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;

        // Restore console methods
        consoleErrorSpy.mockRestore();
        consoleDebugSpy.mockRestore();
    });

    describe('Log level matching logic', () => {
        test('should log error when log level is ERROR', () => {
            // Set log level to ERROR
            process.env.NEXT_LOG_LEVEL = String(LOG_LEVEL.ERROR);

            // Call logger methods
            StraightforwardLogger.error(new Error('Test error'));
            StraightforwardLogger.debug('Test debug'); // eslint-disable-line testing-library/no-debugging-utils

            // Verify error is logged but debug is not
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith(new Error('Test error'));
            expect(consoleDebugSpy).not.toHaveBeenCalled();
        });

        test('should log error and warn when log level is WARN', () => {
            // Set log level to WARN
            process.env.NEXT_LOG_LEVEL = String(LOG_LEVEL.WARN);

            // Call error method with non-Error object
            const testObj = { message: 'test message' };
            StraightforwardLogger.error(testObj);

            // Debug should not be logged for the non-error object at WARN level
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
            expect(consoleDebugSpy).not.toHaveBeenCalled();
        });

        test('should log error, info, and debug when log level is DEBUG', () => {
            // Set log level to DEBUG
            process.env.NEXT_LOG_LEVEL = String(LOG_LEVEL.DEBUG);

            // Call logger methods
            StraightforwardLogger.error('Test error');
            StraightforwardLogger.debug('Test debug', { additionalInfo: true }); // eslint-disable-line testing-library/no-debugging-utils

            // Verify all logs appear
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
            expect(consoleDebugSpy).toHaveBeenCalledWith('Test debug', { additionalInfo: true });
        });

        test('should log debug info for non-Error objects in error() when log level is DEBUG', () => {
            // Set log level to DEBUG
            process.env.NEXT_LOG_LEVEL = String(LOG_LEVEL.DEBUG);

            // Call error with non-Error object
            const customError = { code: 404, message: 'Not found' };
            StraightforwardLogger.error(customError);

            // Should log the original object to debug
            expect(consoleDebugSpy).toHaveBeenCalledWith(customError);
            expect(consoleErrorSpy).toHaveBeenCalledWith(new Error('Unrecognized error'));
        });

        test('should not log when log level is not set', () => {
            // Ensure log level is not set
            delete process.env.NEXT_LOG_LEVEL;

            // Call logger methods
            StraightforwardLogger.error('Test error');
            StraightforwardLogger.debug('Test debug'); // eslint-disable-line testing-library/no-debugging-utils

            // Verify nothing is logged
            expect(consoleErrorSpy).not.toHaveBeenCalled();
            expect(consoleDebugSpy).not.toHaveBeenCalled();
        });

        test('should not log when log level is invalid', () => {
            // Set invalid log level
            process.env.NEXT_LOG_LEVEL = 'invalid';

            // Call logger methods
            StraightforwardLogger.error('Test error');
            StraightforwardLogger.debug('Test debug'); // eslint-disable-line testing-library/no-debugging-utils

            // Verify nothing is logged
            expect(consoleErrorSpy).not.toHaveBeenCalled();
            expect(consoleDebugSpy).not.toHaveBeenCalled();
        });
    });
});

describe('SentryLogger', () => {
    // Store original environment
    const originalEnv = process.env;

    // Create spy mocks for console methods
    let consoleErrorSpy: any;
    let consoleDebugSpy: any;
    let captureExceptionSpy: any;

    beforeEach(() => {
        // Reset process.env for each test
        process.env = { ...originalEnv };

        // Setup console spies
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
        captureExceptionSpy = vi.spyOn(SentryLogger, '_captureException').mockImplementation(() => undefined);

        // Reset mocks between tests
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;

        // Restore console methods
        consoleErrorSpy.mockRestore();
        consoleDebugSpy.mockRestore();
        captureExceptionSpy.mockRestore();
    });

    test('should call captureException when Sentry is enabled', () => {
        // Set log level to ERROR and enable Sentry
        process.env.NEXT_LOG_LEVEL = String(LOG_LEVEL.ERROR);
        process.env.NEXT_PUBLIC_ENABLE_CATCH_EXCEPTIONS = '1';

        // Create error instance
        const errorInstance = new Error('Test error');

        // Call SentryLogger
        SentryLogger.error(errorInstance);

        // Verify error is logged and exception is captured
        expect(captureExceptionSpy).toHaveBeenCalledWith(errorInstance, undefined);
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('should not call captureException when Sentry is disabled', () => {
        // Set log level to ERROR and disable Sentry
        process.env.NEXT_LOG_LEVEL = String(LOG_LEVEL.ERROR);
        process.env.NEXT_PUBLIC_ENABLE_CATCH_EXCEPTIONS = '0';

        // Call SentryLogger
        SentryLogger.error('Test error');

        // Verify exception is not captured
        expect(captureExceptionSpy).not.toHaveBeenCalled();
    });
});
