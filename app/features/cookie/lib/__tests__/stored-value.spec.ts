// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getStoredValue, setStoredValue } from '../stored-value';

const DAY_SECONDS = 24 * 60 * 60;

afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('stored-value', () => {
    it('should return a stored value until its max age passes', () => {
        vi.useFakeTimers({ now: 0 });
        setStoredValue('consent', 'granted', DAY_SECONDS);

        vi.setSystemTime(DAY_SECONDS * 1000 - 1);
        expect(getStoredValue('consent')).toBe('granted');

        vi.setSystemTime(DAY_SECONDS * 1000);
        expect(getStoredValue('consent')).toBeNull();
    });

    it.each([
        ['missing', undefined],
        ['not JSON', 'granted'],
        ['the wrong shape', '{"value":"granted"}'],
    ])('should return null for an entry that is %s', (_case, raw) => {
        if (raw !== undefined) localStorage.setItem('consent', raw);

        expect(getStoredValue('consent')).toBeNull();
    });

    it('should treat blocked storage as empty', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new DOMException('blocked', 'SecurityError');
        });
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('blocked', 'SecurityError');
        });

        expect(() => setStoredValue('consent', 'granted', DAY_SECONDS)).not.toThrow();
        expect(getStoredValue('consent')).toBeNull();
    });
});
