import { beforeEach, vi } from 'vitest';

// Undo the global Logger mock so we can test the real implementation.
vi.unmock('@/app/shared/lib/logger');

// Mock @sentry/nextjs since Logger imports captureException/captureMessage directly from it.
const captureException = vi.fn();
const captureMessage = vi.fn();
vi.mock('@sentry/nextjs', () => ({
    captureException: (...args: unknown[]) => captureException(...args),
    captureMessage: (...args: unknown[]) => captureMessage(...args),
}));

const { Logger } = await import('../logger');

describe('Logger', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
        captureException.mockClear();
        captureMessage.mockClear();
    });

    describe('isLoggable gating', () => {
        it('should suppress all output when NEXT_LOG_LEVEL is unset', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', '');
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

            Logger.error('should not appear');

            expect(spy).not.toHaveBeenCalled();
        });

        it('should suppress output when NEXT_LOG_LEVEL is not a valid number', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', 'abc');
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            Logger.warn('should not appear');

            expect(spy).not.toHaveBeenCalled();
        });

        it('should log error when NEXT_LOG_LEVEL >= ERROR (1)', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', '1');
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

            Logger.error('boom');

            expect(spy).toHaveBeenCalledWith('boom');
        });

        it('should suppress debug when NEXT_LOG_LEVEL = INFO (3)', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', '3');
            const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});

            Logger.debug('verbose'); // eslint-disable-line testing-library/no-debugging-utils

            expect(spy).not.toHaveBeenCalled();
        });

        it('should log debug when NEXT_LOG_LEVEL = DEBUG (4)', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', '4');
            const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});

            Logger.debug('verbose'); // eslint-disable-line testing-library/no-debugging-utils

            expect(spy).toHaveBeenCalledWith('verbose');
        });
    });

    describe('formatArgs', () => {
        beforeEach(() => {
            vi.stubEnv('NEXT_LOG_LEVEL', '4');
        });

        it('should pass only the message when no context is given', () => {
            const spy = vi.spyOn(console, 'info').mockImplementation(() => {});

            Logger.info('hello');

            expect(spy).toHaveBeenCalledWith('hello');
        });

        it('should pass context as a second argument', () => {
            const spy = vi.spyOn(console, 'info').mockImplementation(() => {});

            Logger.info('request failed', { status: 500, url: '/api' });

            expect(spy).toHaveBeenCalledWith('request failed', { status: 500, url: '/api' });
        });

        it('should extract error from context as a separate trailing argument', () => {
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const err = new Error('oops');

            Logger.error('crash', { error: err, module: 'x' });

            expect(spy).toHaveBeenCalledWith('crash', { module: 'x' }, err);
        });

        it('should pass error alone (without empty rest) when context only has error', () => {
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const err = new Error('warn');

            Logger.warn('warning', { error: err });

            expect(spy).toHaveBeenCalledWith('warning', err);
        });
    });

    describe('panic', () => {
        it('should call captureException and log the error', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', '0');
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const err = new Error('fatal');

            Logger.panic('fatal crash', { error: err });

            expect(captureException).toHaveBeenCalledWith(err, undefined);
            expect(spy).toHaveBeenCalledWith('fatal crash', err);
        });

        it('should forward hint to captureException', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', '0');
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const err = new Error('fatal');
            const hint = { data: { route: '/api/test' } };

            Logger.panic('fatal crash', { error: err, hint });

            expect(captureException).toHaveBeenCalledWith(err, hint);
            expect(spy).toHaveBeenCalledWith('fatal crash', err);
        });

        it('should call captureException even when logging is suppressed', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', '');
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const err = new Error('fatal');

            Logger.panic('fatal crash', { error: err });

            expect(captureException).toHaveBeenCalledWith(err, undefined);
            expect(spy).not.toHaveBeenCalled();
        });

        it('should wrap non-Error values before sending to Sentry', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', '0');
            vi.spyOn(console, 'error').mockImplementation(() => {});

            Logger.panic('something broke', { error: 'string error' });

            expect(captureException).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'string error' }),
                undefined
            );
        });
    });

    describe('error with sentry', () => {
        it('should call captureMessage when sentry flag is true', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', '1');
            vi.spyOn(console, 'error').mockImplementation(() => {});

            Logger.error('rate limit hit', { sentry: true });

            expect(captureMessage).toHaveBeenCalledWith('rate limit hit', 'error');
        });

        it('should not call captureMessage by default', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', '1');
            vi.spyOn(console, 'error').mockImplementation(() => {});

            Logger.error('normal error');

            expect(captureMessage).not.toHaveBeenCalled();
        });

        it('should not leak sentry flag into console output', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', '1');
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

            Logger.error('rate limit hit', { route: '/api', sentry: true });

            expect(spy).toHaveBeenCalledWith('rate limit hit', { route: '/api' });
        });
    });
});
