import { afterEach, describe, expect, it, vi } from 'vitest';

import { createIndexedDbCustomIdlStorage, type CustomIdlStorage } from '../custom-idl-storage';

const PROGRAM_ADDRESS = 'devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH';
const DATABASE_NAME = 'explorer:customIdl';

describe('createIndexedDbCustomIdlStorage', () => {
    const storage = createIndexedDbCustomIdlStorage();
    const unsubscribes: (() => void)[] = [];

    afterEach(() => {
        unsubscribes.splice(0).forEach(unsubscribe => unsubscribe());
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe('list', () => {
        it('should return no entries when nothing is stored', async () => {
            expect(await storage.list()).toEqual({ entries: [], ok: true });
        });

        it('should return each stored value under its program address without parsing it', async () => {
            await storage.put({ programAddress: PROGRAM_ADDRESS, value: '{not json' });
            await storage.put({ programAddress: 'not-an-address', value: '{}' });

            expect(await storage.list()).toEqual({
                entries: expect.arrayContaining([
                    { programAddress: PROGRAM_ADDRESS, value: '{not json' },
                    { programAddress: 'not-an-address', value: '{}' },
                ]),
                ok: true,
            });
        });

        it('should skip a record whose key is not a string', async () => {
            await storage.put({ programAddress: PROGRAM_ADDRESS, value: '{}' });
            await writeRaw(store => store.put('{}', 1));

            expect(await storage.list()).toEqual({
                entries: [{ programAddress: PROGRAM_ADDRESS, value: '{}' }],
                ok: true,
            });
        });

        it('should return a value that is not a string under its program address', async () => {
            await storage.list();
            await writeRaw(store => store.put({ idl: {} }, PROGRAM_ADDRESS));

            expect(await storage.list()).toEqual({
                entries: [{ programAddress: PROGRAM_ADDRESS, value: { idl: {} } }],
                ok: true,
            });
        });

        it.each([
            ['the browser has no IndexedDB', () => vi.stubGlobal('indexedDB', undefined)],
            ['the open throws a SecurityError', () => openThrows('SecurityError')],
        ])('should report unavailable storage when %s', async (_, block) => {
            block();

            expect(await storage.list()).toEqual({ ok: false, reason: 'unavailable' });
        });

        it('should report unavailable storage when the open fails with an error event', async () => {
            await upgradeDatabase();

            expect(await storage.list()).toEqual({ ok: false, reason: 'unavailable' });
        });

        it('should close its connection, so a version upgrade in another tab does not wait', async () => {
            await storage.list();

            await expect(upgradeDatabase()).resolves.toBe('upgraded');
        });
    });

    describe('put', () => {
        it('should close its connection after a put and a remove', async () => {
            await storage.put({ programAddress: PROGRAM_ADDRESS, value: '{}' });
            await storage.remove(PROGRAM_ADDRESS);

            await expect(upgradeDatabase()).resolves.toBe('upgraded');
        });

        it('should store a value that list returns unchanged', async () => {
            expect(await storage.put({ programAddress: PROGRAM_ADDRESS, value: '{"a":1}' })).toEqual({ ok: true });
            expect(await storage.list()).toEqual({
                entries: [{ programAddress: PROGRAM_ADDRESS, value: '{"a":1}' }],
                ok: true,
            });
        });

        it('should replace the value under the same program address', async () => {
            await storage.put({ programAddress: PROGRAM_ADDRESS, value: '{"a":1}' });
            await storage.put({ programAddress: PROGRAM_ADDRESS, value: '{"a":2}' });

            expect(await storage.list()).toEqual({
                entries: [{ programAddress: PROGRAM_ADDRESS, value: '{"a":2}' }],
                ok: true,
            });
        });

        it.each([
            ['QuotaExceededError', 'quota-exceeded'],
            ['UnknownError', 'unavailable'],
        ])('should return the settled reason when the commit aborts with a %s', async (errorName, reason) => {
            abortCommitWith(errorName);

            expect(await storage.put({ programAddress: PROGRAM_ADDRESS, value: '{}' })).toEqual({ ok: false, reason });
            vi.restoreAllMocks();
            expect(await storage.list()).toEqual({ entries: [], ok: true });
        });

        it('should return unavailable when the open throws a SecurityError', async () => {
            openThrows('SecurityError');

            expect(await storage.put({ programAddress: PROGRAM_ADDRESS, value: '{}' })).toEqual({
                ok: false,
                reason: 'unavailable',
            });
        });
    });

    describe('update', () => {
        it('should store the value that the change returns for the stored value', async () => {
            await storage.put({ programAddress: PROGRAM_ADDRESS, value: 'a' });

            expect(await storage.update(PROGRAM_ADDRESS, value => `${String(value)}b`)).toEqual({ ok: true });

            expect(await storage.list()).toEqual({
                entries: [{ programAddress: PROGRAM_ADDRESS, value: 'ab' }],
                ok: true,
            });
        });

        it('should keep the stored value when the change returns undefined', async () => {
            await storage.put({ programAddress: PROGRAM_ADDRESS, value: 'a' });

            expect(await storage.update(PROGRAM_ADDRESS, () => undefined)).toEqual({ ok: true });

            expect(await storage.list()).toEqual({
                entries: [{ programAddress: PROGRAM_ADDRESS, value: 'a' }],
                ok: true,
            });
        });

        it('should pass undefined to the change for a program with no stored value', async () => {
            const change = vi.fn(() => undefined);

            await storage.update(PROGRAM_ADDRESS, change);

            expect(change).toHaveBeenCalledWith(undefined);
            expect(await storage.list()).toEqual({ entries: [], ok: true });
        });

        it('should return unavailable when the open throws a SecurityError', async () => {
            openThrows('SecurityError');

            expect(await storage.update(PROGRAM_ADDRESS, () => 'a')).toEqual({ ok: false, reason: 'unavailable' });
        });
    });

    describe('remove', () => {
        it('should remove the stored value', async () => {
            await storage.put({ programAddress: PROGRAM_ADDRESS, value: '{}' });

            expect(await storage.remove(PROGRAM_ADDRESS)).toEqual({ ok: true });
            expect(await storage.list()).toEqual({ entries: [], ok: true });
        });

        it('should return unavailable when the open throws a SecurityError', async () => {
            openThrows('SecurityError');

            expect(await storage.remove(PROGRAM_ADDRESS)).toEqual({ ok: false, reason: 'unavailable' });
        });
    });

    describe('subscribe', () => {
        it.each([
            ['a put', (otherTab: CustomIdlStorage) => otherTab.put({ programAddress: PROGRAM_ADDRESS, value: '{}' })],
            ['a remove', (otherTab: CustomIdlStorage) => otherTab.remove(PROGRAM_ADDRESS)],
            ['an update', (otherTab: CustomIdlStorage) => otherTab.update(PROGRAM_ADDRESS, () => '{}')],
        ])('should call back for %s in another tab', async (_, change) => {
            const onChange = subscribe(storage);

            await change(createIndexedDbCustomIdlStorage());

            await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
        });

        it('should not call back for a write in the same tab', async () => {
            const onChange = subscribe(storage);
            const otherTabOnChange = subscribe(createIndexedDbCustomIdlStorage());

            await storage.put({ programAddress: PROGRAM_ADDRESS, value: '{}' });

            await vi.waitFor(() => expect(otherTabOnChange).toHaveBeenCalledTimes(1));
            expect(onChange).not.toHaveBeenCalled();
        });

        it('should post no channel message for a write that failed', async () => {
            const postMessage = vi.spyOn(BroadcastChannel.prototype, 'postMessage');
            abortCommitWith('QuotaExceededError');

            await storage.put({ programAddress: PROGRAM_ADDRESS, value: '{}' });

            expect(postMessage).not.toHaveBeenCalled();
        });

        it.each([
            ['has no BroadcastChannel', undefined],
            [
                'throws from the BroadcastChannel constructor',
                class {
                    constructor() {
                        throw new DOMException('blocked', 'SecurityError');
                    }
                },
            ],
        ])('should store and list a value when the browser %s', async (_, channel) => {
            vi.stubGlobal('BroadcastChannel', channel);
            const tab = createIndexedDbCustomIdlStorage();
            const onChange = subscribe(tab);

            expect(await tab.put({ programAddress: PROGRAM_ADDRESS, value: '{}' })).toEqual({ ok: true });

            expect(await tab.list()).toEqual({ entries: [{ programAddress: PROGRAM_ADDRESS, value: '{}' }], ok: true });
            expect(onChange).not.toHaveBeenCalled();
        });

        it('should report a stored write as saved when the channel message fails', async () => {
            vi.spyOn(BroadcastChannel.prototype, 'postMessage').mockImplementation(() => {
                throw new DOMException('closed', 'InvalidStateError');
            });
            const tab = createIndexedDbCustomIdlStorage();

            expect(await tab.put({ programAddress: PROGRAM_ADDRESS, value: '{}' })).toEqual({ ok: true });

            expect(await tab.list()).toEqual({ entries: [{ programAddress: PROGRAM_ADDRESS, value: '{}' }], ok: true });
        });

        it('should stop calling back after unsubscribe', async () => {
            const onChange = vi.fn();
            storage.subscribe(onChange)();
            const otherTabOnChange = subscribe(createIndexedDbCustomIdlStorage());
            const thirdTab = createIndexedDbCustomIdlStorage();

            await thirdTab.put({ programAddress: PROGRAM_ADDRESS, value: '{}' });

            await vi.waitFor(() => expect(otherTabOnChange).toHaveBeenCalledTimes(1));
            expect(onChange).not.toHaveBeenCalled();
        });
    });

    function subscribe(tab: CustomIdlStorage) {
        const onChange = vi.fn();
        unsubscribes.push(tab.subscribe(onChange));
        return onChange;
    }
});

function openThrows(errorName: string) {
    vi.spyOn(indexedDB, 'open').mockImplementation(() => {
        throw new DOMException('blocked', errorName);
    });
}

// The browser aborts the commit itself, so the error is on the transaction, not on the request.
function abortCommitWith(errorName: string) {
    const put = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (
        this: IDBObjectStore,
        ...args: Parameters<IDBObjectStore['put']>
    ) {
        const request = put.apply(this, args);
        Object.defineProperty(this.transaction, 'error', { value: new DOMException('refused', errorName) });
        this.transaction.abort();
        return request;
    });
}

async function writeRaw(operation: (store: IDBObjectStore) => void) {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    const transaction = database.transaction('records', 'readwrite');
    operation(transaction.objectStore('records'));
    await new Promise(resolve => (transaction.oncomplete = resolve));
    database.close();
}

function upgradeDatabase() {
    return new Promise<string>((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, 2);
        request.onblocked = () => resolve('blocked');
        request.onsuccess = () => {
            request.result.close();
            resolve('upgraded');
        };
        request.onerror = () => reject(request.error);
    });
}
