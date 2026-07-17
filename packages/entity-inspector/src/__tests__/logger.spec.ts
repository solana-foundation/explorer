// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

import { consoleLogger } from '../logger.js';

describe('consoleLogger', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should forward to the matching console method, passing context only when provided', () => {
        const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
        const info = vi.spyOn(console, 'info').mockImplementation(() => {});
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        consoleLogger.debug('debug with', { a: 1 });
        consoleLogger.debug('debug without');
        consoleLogger.info('info with', { b: 2 });
        consoleLogger.info('info without');
        consoleLogger.warn('warn with', { c: 3 });
        consoleLogger.warn('warn without');

        expect(debug).toHaveBeenNthCalledWith(1, 'debug with', { a: 1 });
        expect(debug).toHaveBeenNthCalledWith(2, 'debug without');
        expect(info).toHaveBeenNthCalledWith(1, 'info with', { b: 2 });
        expect(info).toHaveBeenNthCalledWith(2, 'info without');
        expect(warn).toHaveBeenNthCalledWith(1, 'warn with', { c: 3 });
        expect(warn).toHaveBeenNthCalledWith(2, 'warn without');
    });
});
