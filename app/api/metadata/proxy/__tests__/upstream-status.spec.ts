import { describe, expect, it } from 'vitest';

import { toProxyStatus } from '../feature/lib/upstream-status';

describe('toProxyStatus', () => {
    it.each([400, 403, 404, 410, 429, 451, 500, 503, 504])('should pass upstream %i through unchanged', status => {
        expect(toProxyStatus(status)).toBe(status);
    });

    // 413 has a `STATUS_MESSAGES` entry but is not passed through, which a "known status" check would miss.
    it.each([401, 413])('should map unlisted upstream %i to 502', status => {
        expect(toProxyStatus(status)).toBe(502);
    });
});
