// @vitest-environment jsdom
import { enums } from 'superstruct';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getStoredValue, setStoredValue } from '../stored-value';

const DAY_SECONDS = 24 * 60 * 60;
const Consent = enums(['granted', 'denied']);

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
        expect(getStoredValue('consent', Consent)).toBe('granted');

        vi.setSystemTime(DAY_SECONDS * 1000);
        expect(getStoredValue('consent', Consent)).toBeUndefined();
    });

    it.each([
        ['that is missing', undefined],
        ['that is not JSON', 'granted'],
        ['of the wrong shape', '{"value":"granted"}'],
        ['with a value the struct rejects', `{"expiresAt":${Number.MAX_SAFE_INTEGER},"value":"maybe"}`],
    ])('should return undefined for an entry %s', (_case, raw) => {
        if (raw !== undefined) localStorage.setItem('consent', raw);

        expect(getStoredValue('consent', Consent)).toBeUndefined();
    });

    it('should treat blocked storage as empty', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new DOMException('blocked', 'SecurityError');
        });
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('blocked', 'SecurityError');
        });

        expect(() => setStoredValue('consent', 'granted', DAY_SECONDS)).not.toThrow();
        expect(getStoredValue('consent', Consent)).toBeUndefined();
    });
});
