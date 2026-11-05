import { describe, expect, it } from 'vitest';

import { isTransientStatus } from '../http-status';

describe('isTransientStatus', () => {
    it.each([408, 429, 500, 502, 503, 504])('should be true for %i', status => {
        expect(isTransientStatus(status)).toBe(true);
    });

    it.each([200, 400, 401, 403, 404, 422, 499])('should be false for %i', status => {
        expect(isTransientStatus(status)).toBe(false);
    });
});
