import { createStore } from 'jotai';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { MAX_CLUSTER_NAME_LENGTH } from '../cluster-name';
import { addSavedClusterAtom, parseSavedClusters, removeSavedClusterAtom, savedClustersAtom } from '../cluster-storage';

const STORAGE_KEY = 'explorer:savedClusters';

// `savedClustersAtom` reads storage on mount, not on first `get`. Subscribing is what mounts it.
function loadFromStorage(raw: string): unknown {
    localStorage.setItem(STORAGE_KEY, raw);
    const store = createStore();
    store.sub(savedClustersAtom, () => undefined);
    return store.get(savedClustersAtom);
}

describe('cluster-storage atoms', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('savedClustersAtom', () => {
        it('should default to empty array', () => {
            const store = createStore();
            expect(store.get(savedClustersAtom)).toEqual([]);
        });
    });

    describe('addSavedClusterAtom', () => {
        it('should add a cluster to an empty list', () => {
            const store = createStore();
            store.set(addSavedClusterAtom, { name: 'Local', url: 'http://localhost:8899' });
            expect(store.get(savedClustersAtom)).toEqual([{ name: 'Local', url: 'http://localhost:8899' }]);
        });

        it('should append to existing clusters', () => {
            const store = createStore();
            store.set(addSavedClusterAtom, { name: 'Local', url: 'http://localhost:8899' });
            store.set(addSavedClusterAtom, { name: 'Staging', url: 'http://staging.example.com' });
            expect(store.get(savedClustersAtom)).toHaveLength(2);
            expect(store.get(savedClustersAtom)[1].name).toBe('Staging');
        });

        it('should replace an existing cluster with the same name', () => {
            const store = createStore();
            store.set(addSavedClusterAtom, { name: 'Local', url: 'http://localhost:8899' });
            store.set(addSavedClusterAtom, { name: 'Local', url: 'http://localhost:9999' });
            expect(store.get(savedClustersAtom)).toEqual([{ name: 'Local', url: 'http://localhost:9999' }]);
        });

        it('should allow the same URL under different names', () => {
            const store = createStore();
            store.set(addSavedClusterAtom, { name: 'Local', url: 'http://localhost:8899' });
            store.set(addSavedClusterAtom, { name: 'Also Local', url: 'http://localhost:8899' });
            expect(store.get(savedClustersAtom)).toEqual([
                { name: 'Local', url: 'http://localhost:8899' },
                { name: 'Also Local', url: 'http://localhost:8899' },
            ]);
        });
    });

    describe('removeSavedClusterAtom', () => {
        it('should remove a cluster by name', () => {
            const store = createStore();
            store.set(addSavedClusterAtom, { name: 'Local', url: 'http://localhost:8899' });
            store.set(addSavedClusterAtom, { name: 'Staging', url: 'http://staging.example.com' });
            store.set(removeSavedClusterAtom, 'Local');
            expect(store.get(savedClustersAtom)).toEqual([{ name: 'Staging', url: 'http://staging.example.com' }]);
        });

        it('should produce an empty list when removing the last cluster', () => {
            const store = createStore();
            store.set(addSavedClusterAtom, { name: 'Local', url: 'http://localhost:8899' });
            store.set(removeSavedClusterAtom, 'Local');
            expect(store.get(savedClustersAtom)).toEqual([]);
        });

        it('should do nothing when name does not exist', () => {
            const store = createStore();
            store.set(addSavedClusterAtom, { name: 'Local', url: 'http://localhost:8899' });
            store.set(removeSavedClusterAtom, 'Nonexistent');
            expect(store.get(savedClustersAtom)).toHaveLength(1);
        });
    });

    describe('parseSavedClusters', () => {
        it('should keep entries whose URL is an RPC endpoint', () => {
            expect(
                parseSavedClusters([
                    { name: 'Local', url: 'http://localhost:8899' },
                    { name: 'Staging', url: 'https://staging.example.com/rpc?key=abc' },
                ]),
            ).toEqual([
                { name: 'Local', url: 'http://localhost:8899' },
                { name: 'Staging', url: 'https://staging.example.com/rpc?key=abc' },
            ]);
        });

        it.each([
            ['not JSON-shaped at all', 'not-a-url'],
            ['a bare host:port', 'localhost:8899'],
            ['a non-http(s) scheme', 'javascript:alert(1)'],
            ['an empty URL', ''],
        ])('should drop an entry with %s', (_label, url) => {
            expect(parseSavedClusters([{ name: 'Broken', url }])).toEqual([]);
        });

        it('should keep the valid entries alongside a broken one', () => {
            expect(
                parseSavedClusters([
                    { name: 'Broken', url: 'not-a-url' },
                    { name: 'Local', url: 'http://localhost:8899' },
                ]),
            ).toEqual([{ name: 'Local', url: 'http://localhost:8899' }]);
        });

        it.each([
            ['a missing url', { name: 'Local' }],
            ['a missing name', { url: 'http://localhost:8899' }],
            ['a non-string name', { name: 42, url: 'http://localhost:8899' }],
            ['a blank name', { name: '   ', url: 'http://localhost:8899' }],
            ['a null entry', null],
            ['a string entry', 'http://localhost:8899'],
        ])('should drop an entry with %s', (_label, entry) => {
            expect(parseSavedClusters([entry])).toEqual([]);
        });

        it('should trim names, matching what the save form stores', () => {
            expect(parseSavedClusters([{ name: '  Local  ', url: 'http://localhost:8899' }])).toEqual([
                { name: 'Local', url: 'http://localhost:8899' },
            ]);
        });

        it('should cap a name that is longer than the form allows', () => {
            const [cluster] = parseSavedClusters([{ name: 'x'.repeat(200), url: 'http://localhost:8899' }]);
            expect(cluster.name).toBe('x'.repeat(MAX_CLUSTER_NAME_LENGTH));
        });

        it('should keep the last entry when two share a name', () => {
            expect(
                parseSavedClusters([
                    { name: 'Local', url: 'http://localhost:8899' },
                    { name: 'Local', url: 'http://localhost:9999' },
                ]),
            ).toEqual([{ name: 'Local', url: 'http://localhost:9999' }]);
        });

        it.each([
            ['an object', { name: 'Local', url: 'http://localhost:8899' }],
            ['a string', 'nonsense'],
            ['null', null],
        ])('should return an empty list when the root is %s', (_label, value) => {
            expect(parseSavedClusters(value)).toEqual([]);
        });
    });

    describe('loading from localStorage', () => {
        it('should drop an entry whose URL was hand-edited into an unusable value', () => {
            expect(
                loadFromStorage(
                    JSON.stringify([
                        { name: 'Broken', url: 'htp://oops' },
                        { name: 'Local', url: 'http://localhost:8899' },
                    ]),
                ),
            ).toEqual([{ name: 'Local', url: 'http://localhost:8899' }]);
        });

        it('should return an empty list when the stored value is not an array', () => {
            expect(loadFromStorage(JSON.stringify({ name: 'Local', url: 'http://localhost:8899' }))).toEqual([]);
        });

        it('should return an empty list when the stored value is not JSON', () => {
            expect(loadFromStorage('{oops')).toEqual([]);
        });

        it('should persist the sanitized list on the next write', () => {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify([
                    { name: 'Broken', url: 'htp://oops' },
                    { name: 'Local', url: 'http://localhost:8899' },
                ]),
            );
            const store = createStore();
            store.sub(savedClustersAtom, () => undefined);
            store.set(removeSavedClusterAtom, 'Nonexistent');
            expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '')).toEqual([
                { name: 'Local', url: 'http://localhost:8899' },
            ]);
        });
    });
});
