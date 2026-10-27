export type StoredEntry = { programAddress: string; value: string };

export type ReadEntry = { programAddress: string; value: unknown };

export type StorageReadResult = { ok: true; entries: ReadEntry[] } | { ok: false; reason: 'unavailable' };

export type StorageWriteResult = { ok: true } | { ok: false; reason: 'quota-exceeded' | 'unavailable' };

export type CustomIdlStorage = {
    list(): Promise<StorageReadResult>;
    put(entry: StoredEntry): Promise<StorageWriteResult>;
    remove(programAddress: string): Promise<StorageWriteResult>;
    subscribe(onChange: () => void): () => void;
    update(programAddress: string, change: (value: unknown) => string | undefined): Promise<StorageWriteResult>;
};

const DATABASE_NAME = 'explorer:customIdl';
const DATABASE_VERSION = 1;
const STORE_NAME = 'records';

export function createIndexedDbCustomIdlStorage(): CustomIdlStorage {
    let channel: BroadcastChannel | undefined;
    const getChannel = (): BroadcastChannel | undefined => {
        if (channel || typeof BroadcastChannel === 'undefined') return channel;
        try {
            channel = new BroadcastChannel(DATABASE_NAME);
        } catch {}
        return channel;
    };

    async function writeAndNotify(operation: (store: IDBObjectStore) => void): Promise<StorageWriteResult> {
        const result = await write(operation);
        if (result.ok) notifyOtherTabs();
        return result;
    }

    function notifyOtherTabs() {
        try {
            getChannel()?.postMessage(undefined);
        } catch {}
    }

    return {
        async list() {
            try {
                return { entries: await readEntries(), ok: true };
            } catch {
                return { ok: false, reason: 'unavailable' };
            }
        },
        put({ programAddress, value }) {
            return writeAndNotify(store => store.put(value, programAddress));
        },
        remove(programAddress) {
            return writeAndNotify(store => store.delete(programAddress));
        },
        subscribe(onChange) {
            const target = getChannel();
            const listener = () => onChange();
            target?.addEventListener('message', listener);
            return () => target?.removeEventListener('message', listener);
        },
        update(programAddress, change) {
            return writeAndNotify(store => {
                const request = store.get(programAddress);
                request.onsuccess = () => {
                    const value = change(request.result);
                    if (value !== undefined) store.put(value, programAddress);
                };
            });
        },
    };
}

export const customIdlStorage = createIndexedDbCustomIdlStorage();

async function readEntries(): Promise<ReadEntry[]> {
    const database = await openDatabase();
    try {
        const store = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
        const [keys, values] = await Promise.all([requestResult(store.getAllKeys()), requestResult(store.getAll())]);
        return keys.flatMap((key, index) => {
            const value: unknown = values[index];
            return typeof key === 'string' ? [{ programAddress: key, value }] : [];
        });
    } finally {
        database.close();
    }
}

async function write(operation: (store: IDBObjectStore) => void): Promise<StorageWriteResult> {
    try {
        const database = await openDatabase();
        try {
            const transaction = database.transaction(STORE_NAME, 'readwrite');
            operation(transaction.objectStore(STORE_NAME));
            await transactionCompletion(transaction);
        } finally {
            database.close();
        }
        return { ok: true };
    } catch (error) {
        return { ok: false, reason: isQuotaExceededError(error) ? 'quota-exceeded' : 'unavailable' };
    }
}

function isQuotaExceededError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'QuotaExceededError';
}

function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function transactionCompletion(transaction: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(transaction.error);
    });
}
