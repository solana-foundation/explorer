// @vitest-environment jsdom

import { beforeEach, type MockInstance, vi } from 'vitest';

// Undo the global Logger mock so we can test the real implementation.
vi.unmock('@/app/shared/lib/logger');

// Mock @sentry/nextjs since Logger imports captureException/captureMessage/withScope directly from it.
const captureException = vi.fn();
const captureMessage = vi.fn();
const mockScope = { setExtras: vi.fn(), setLevel: vi.fn(), setTag: vi.fn() };
vi.mock('@sentry/nextjs', () => ({
    captureException: (...args: unknown[]) => captureException(...args),
    captureMessage: (...args: unknown[]) => captureMessage(...args),
    withScope: (cb: (scope: typeof mockScope) => void) => cb(mockScope),
}));

const { Logger } = await import('../logger');

describe('Logger', () => {
    let consoleSpy: Record<'debug' | 'error' | 'info' | 'warn', MockInstance>;

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
        captureException.mockClear();
        captureMessage.mockClear();
        mockScope.setLevel.mockClear();
        mockScope.setExtras.mockClear();
        mockScope.setTag.mockClear();
        consoleSpy = {
            debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
            error: vi.spyOn(console, 'error').mockImplementation(() => {}),
            info: vi.spyOn(console, 'info').mockImplementation(() => {}),
            warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
        };
    });

    describe('isLoggable gating', () => {
        it('should suppress all output when NEXT_LOG_LEVEL is unset', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', '');

            Logger.error('should not appear');

            expect(consoleSpy.error).not.toHaveBeenCalled();
        });

        it('should suppress output when NEXT_LOG_LEVEL is not a valid number', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', 'abc');

            Logger.warn('should not appear');

            expect(consoleSpy.warn).not.toHaveBeenCalled();
        });

        it('should log error when NEXT_LOG_LEVEL >= ERROR (1)', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', '1');
            const err = new Error('boom');

            Logger.error(err);

            expect(consoleSpy.error).toHaveBeenCalledWith(err);
        });

        it('should suppress debug when NEXT_LOG_LEVEL = INFO (3)', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', '3');

            Logger.debug('verbose'); // eslint-disable-line testing-library/no-debugging-utils

            expect(consoleSpy.debug).not.toHaveBeenCalled();
        });

        it('should log debug when NEXT_LOG_LEVEL = DEBUG (4)', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', '4');

            Logger.debug('verbose'); // eslint-disable-line testing-library/no-debugging-utils

            expect(consoleSpy.debug).toHaveBeenCalledWith('verbose');
        });
    });

    describe('formatArgs', () => {
        beforeEach(() => {
            vi.stubEnv('NEXT_LOG_LEVEL', '4');
        });

        it('should pass only the message when no context is given', () => {
            Logger.info('hello');

            expect(consoleSpy.info).toHaveBeenCalledWith('hello');
        });

        it('should pass context as a second argument', () => {
            Logger.info('request failed', { status: 500, url: '/api' });

            expect(consoleSpy.info).toHaveBeenCalledWith('request failed', { status: 500, url: '/api' });
        });

        it('should log Error with context when first arg is an Error', () => {
            const err = new Error('oops');

            Logger.error(err, { module: 'x' });

            expect(consoleSpy.error).toHaveBeenCalledWith(err, { module: 'x' });
        });
    });

    describe('panic', () => {
        beforeEach(() => {
            vi.stubEnv('NEXT_LOG_LEVEL', '0');
        });

        it('should call captureException with fatal level and no extras when sentryExtras is not provided', () => {
            const err = new Error('fatal');

            Logger.panic(err);

            expect(mockScope.setLevel).toHaveBeenCalledWith('fatal');
            expect(captureException).toHaveBeenCalledWith(err);
            expect(mockScope.setExtras).not.toHaveBeenCalled();
        });

        it('should forward sentryExtras to Sentry scope', () => {
            const err = new Error('fatal');

            Logger.panic(err, { sentryExtras: { endpoint: '/api', module: 'rpc' } });

            expect(mockScope.setLevel).toHaveBeenCalledWith('fatal');
            expect(mockScope.setExtras).toHaveBeenCalledWith({ endpoint: '/api', module: 'rpc' });
            expect(captureException).toHaveBeenCalledWith(err);
        });

        it('should not leak sentryExtras into console output', () => {
            const err = new Error('fatal');

            Logger.panic(err, { route: '/api', sentryExtras: { module: 'rpc' } });

            expect(consoleSpy.error).toHaveBeenCalledWith(err, { route: '/api' });
        });

        it('should call captureException even when logging is suppressed', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', '');
            const err = new Error('fatal');

            Logger.panic(err);

            expect(captureException).toHaveBeenCalledWith(err);
            expect(consoleSpy.error).not.toHaveBeenCalled();
        });
    });

    const rateLimitError = new Error('rate limit hit');

    // jsdom defines `window`, so the server tests set `window` to undefined.
    describe.each([
        {
            capture: captureException,
            log: (context?: Parameters<typeof Logger.error>[1]) => Logger.error(rateLimitError, context),
            logged: rateLimitError,
            method: 'error' as const,
            sentryLevel: 'error',
        },
        {
            capture: captureMessage,
            log: (context?: Parameters<typeof Logger.warn>[1]) => Logger.warn('[api] rate limited', context),
            logged: '[api] rate limited',
            method: 'warn' as const,
            sentryLevel: 'warning',
        },
    ])('$method with sentry', ({ capture, log, logged, method, sentryLevel }) => {
        beforeEach(() => {
            vi.stubGlobal('window', undefined);
            vi.stubEnv('NEXT_LOG_LEVEL', '2');
        });

        it('should capture at the method level without the client report tag when sentry flag is true', () => {
            log({ sentry: true });

            expect(mockScope.setLevel).toHaveBeenCalledWith(sentryLevel);
            expect(capture).toHaveBeenCalledWith(logged);
            expect(mockScope.setTag).not.toHaveBeenCalled();
        });

        it('should forward sentryExtras to Sentry scope', () => {
            log({ sentry: true, sentryExtras: { route: '/api', status: 429 } });

            expect(mockScope.setLevel).toHaveBeenCalledWith(sentryLevel);
            expect(mockScope.setExtras).toHaveBeenCalledWith({ route: '/api', status: 429 });
            expect(capture).toHaveBeenCalledWith(logged);
        });

        it('should not leak sentryExtras into console output', () => {
            log({ route: '/api', sentry: true, sentryExtras: { internal: true } });

            expect(consoleSpy[method]).toHaveBeenCalledWith(logged, { route: '/api' });
        });

        it('should not capture by default', () => {
            log();

            expect(capture).not.toHaveBeenCalled();
        });

        it('should not leak sentry flag into console output', () => {
            log({ route: '/api', sentry: true });

            expect(consoleSpy[method]).toHaveBeenCalledWith(logged, { route: '/api' });
        });
    });

    describe('error with sentry', () => {
        beforeEach(() => vi.stubGlobal('window', undefined));

        it('should send "Unrecognized error" to Sentry for non-Error values and log the raw value at debug level', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', '4');

            Logger.error('string error', { sentry: true });

            expect(captureException).toHaveBeenCalledWith(expect.objectContaining({ message: 'Unrecognized error' }));
            expect(mockScope.setLevel).toHaveBeenCalledWith('error');
            expect(consoleSpy.debug).toHaveBeenCalledWith('[Logger] non-Error value in error field:', 'string error');
        });
    });

    describe('info', () => {
        it('should log when NEXT_LOG_LEVEL >= INFO (3)', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', '3');

            Logger.info('starting up');

            expect(consoleSpy.info).toHaveBeenCalledWith('starting up');
        });

        it('should suppress when NEXT_LOG_LEVEL < INFO', () => {
            vi.stubEnv('NEXT_LOG_LEVEL', '2');

            Logger.info('starting up');

            expect(consoleSpy.info).not.toHaveBeenCalled();
        });
    });

    describe('browser gating', () => {
        beforeEach(() => {
            vi.stubEnv('NEXT_LOG_LEVEL', '2');
        });

        it('should not call captureException in the browser when sentry is true', () => {
            Logger.error(new Error('server-minded call site'), { sentry: true });

            expect(captureException).not.toHaveBeenCalled();
        });

        it('should not call captureMessage in the browser when sentry is true', () => {
            Logger.warn('[api] rate limited', { sentry: true });

            expect(captureMessage).not.toHaveBeenCalled();
        });

        it('should call captureException in the browser when sentry is "always"', () => {
            const err = new Error('client-only failure');

            Logger.error(err, { sentry: 'always' });

            expect(captureException).toHaveBeenCalledWith(err);
        });

        it('should call captureMessage in the browser when sentry is "always"', () => {
            Logger.warn('[idl] fetch failed', { sentry: 'always' });

            expect(captureMessage).toHaveBeenCalledWith('[idl] fetch failed');
        });

        it('should tag browser captures so the client beforeSend passes them through', () => {
            Logger.error(new Error('client-only failure'), { sentry: 'always' });

            expect(mockScope.setTag).toHaveBeenCalledWith('client_report', 'allowed');
        });

        it('should capture panic in the browser without an opt-in and tag it', () => {
            const err = new Error('render crash');

            Logger.panic(err);

            expect(captureException).toHaveBeenCalledWith(err);
            expect(mockScope.setTag).toHaveBeenCalledWith('client_report', 'allowed');
        });
    });
});
