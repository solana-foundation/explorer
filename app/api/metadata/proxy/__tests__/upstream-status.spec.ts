import { describe, expect, it } from 'vitest';

import { toProxyStatus } from '../feature/lib/upstream-status';

describe('toProxyStatus', () => {
    it.each([400, 403, 404, 410, 429, 451, 500, 503, 504])('should pass upstream %i through unchanged', status => {
        expect(toProxyStatus(status)).toBe(status);
    });

    it.each([401, 304, 502])('should map unlisted upstream %i to 502', status => {
        expect(toProxyStatus(status)).toBe(502);
    });
});
