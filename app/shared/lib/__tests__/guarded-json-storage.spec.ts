import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createGuardedJsonStorage } from '../guarded-json-storage';

const KEY = 'test-key';
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

beforeEach(() => {
    window.localStorage.clear();
});

function subscribe(
    storage: ReturnType<typeof createGuardedJsonStorage<boolean>>,
    ...args: Parameters<NonNullable<typeof storage.subscribe>>
) {
    const unsubscribe = storage.subscribe?.(...args);
    if (!unsubscribe) throw new Error('subscribe did not return an unsubscribe function');
    return unsubscribe;
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('createGuardedJsonStorage', () => {
    describe('getItem', () => {
        it('should return the stored value when it is valid', () => {
            const storage = createGuardedJsonStorage(isBoolean, true);
            window.localStorage.setItem(KEY, 'false');

            const result = storage.getItem(KEY, true);

            expect(result).toBe(false);
        });

        it('should return the fallback when the stored value fails validation', () => {
            const storage = createGuardedJsonStorage(isBoolean, true);
            window.localStorage.setItem(KEY, '"garbage"');

            const result = storage.getItem(KEY, false);

            expect(result).toBe(true);
        });

        it('should return the fallback when localStorage access throws', () => {
            const storage = createGuardedJsonStorage(isBoolean, true);
            vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
                throw new Error('blocked');
            });

            const result = storage.getItem(KEY, false);

            expect(result).toBe(true);
        });
    });

    describe('getItem with corrupt JSON', () => {
        it('should return initialValue when the stored value is not valid JSON', () => {
            const storage = createGuardedJsonStorage(isBoolean, true);
            window.localStorage.setItem(KEY, '{not json');

            const result = storage.getItem(KEY, false);

            expect(result).toBe(false);
        });
    });

    describe('setItem', () => {
        it('should persist a value that differs from the fallback', () => {
            const storage = createGuardedJsonStorage(isBoolean, true);

            storage.setItem(KEY, false);

            expect(window.localStorage.getItem(KEY)).toBe('false');
        });

        it('should remove the key instead of persisting the fallback', () => {
            const storage = createGuardedJsonStorage(isBoolean, true);
            window.localStorage.setItem(KEY, 'false');

            storage.setItem(KEY, true);

            expect(window.localStorage.getItem(KEY)).toBeNull();
        });

        it('should not throw when localStorage access throws', () => {
            const storage = createGuardedJsonStorage(isBoolean, true);
            vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw new Error('quota exceeded');
            });

            const act = () => storage.setItem(KEY, false);

            expect(act).not.toThrow();
        });
    });

    describe('removeItem', () => {
        it('should remove the stored key', () => {
            const storage = createGuardedJsonStorage(isBoolean, true);
            window.localStorage.setItem(KEY, 'false');

            storage.removeItem(KEY);

            expect(window.localStorage.getItem(KEY)).toBeNull();
        });

        it('should not throw when localStorage access throws', () => {
            const storage = createGuardedJsonStorage(isBoolean, true);
            vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
                throw new Error('blocked');
            });

            const act = () => storage.removeItem(KEY);

            expect(act).not.toThrow();
        });
    });

    describe('subscribe', () => {
        it('should forward a valid cross-tab value to the callback', () => {
            const storage = createGuardedJsonStorage(isBoolean, true);
            const callback = vi.fn();
            const unsubscribe = subscribe(storage, KEY, callback, true);

            window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: 'false' }));

            expect(callback).toHaveBeenCalledExactlyOnceWith(false);
            unsubscribe();
        });

        it('should forward the fallback when the cross-tab value fails validation', () => {
            const storage = createGuardedJsonStorage(isBoolean, true);
            const callback = vi.fn();
            const unsubscribe = subscribe(storage, KEY, callback, false);

            window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: '"garbage"' }));

            expect(callback).toHaveBeenCalledExactlyOnceWith(true);
            unsubscribe();
        });

        it('should forward initialValue when the cross-tab value is not valid JSON', () => {
            const storage = createGuardedJsonStorage(isBoolean, true);
            const callback = vi.fn();
            const unsubscribe = subscribe(storage, KEY, callback, false);

            window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: '{not json' }));

            expect(callback).toHaveBeenCalledExactlyOnceWith(false);
            unsubscribe();
        });

        it('should forward initialValue when another tab removes the key', () => {
            const storage = createGuardedJsonStorage(isBoolean, true);
            const callback = vi.fn();
            const unsubscribe = subscribe(storage, KEY, callback, false);

            window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: null }));

            expect(callback).toHaveBeenCalledExactlyOnceWith(false);
            unsubscribe();
        });

        it('should ignore events for other keys', () => {
            const storage = createGuardedJsonStorage(isBoolean, true);
            const callback = vi.fn();
            const unsubscribe = subscribe(storage, KEY, callback, true);

            window.dispatchEvent(new StorageEvent('storage', { key: 'other-key', newValue: 'false' }));

            expect(callback).not.toHaveBeenCalled();
            unsubscribe();
        });

        it('should stop notifying after unsubscribe', () => {
            const storage = createGuardedJsonStorage(isBoolean, true);
            const callback = vi.fn();
            const unsubscribe = subscribe(storage, KEY, callback, true);

            unsubscribe();
            window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: 'false' }));

            expect(callback).not.toHaveBeenCalled();
        });

        it('should not throw when localStorage access is revoked after mount', () => {
            const storage = createGuardedJsonStorage(isBoolean, true);
            const callback = vi.fn();
            const unsubscribe = subscribe(storage, KEY, callback, true);
            vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
                throw new Error('revoked');
            });

            const act = () =>
                window.dispatchEvent(
                    new StorageEvent('storage', { key: KEY, newValue: 'false', storageArea: window.sessionStorage }),
                );

            expect(act).not.toThrow();
            expect(callback).not.toHaveBeenCalled();
            unsubscribe();
        });
    });
});
