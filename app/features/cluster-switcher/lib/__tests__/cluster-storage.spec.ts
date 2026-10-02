import { createStore } from 'jotai';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { MAX_CLUSTER_NAME_LENGTH } from '../cluster-name';
import {
    addSavedClusterAtom,
    parseSavedClusters,
    removeSavedClusterAtom,
    savedClustersAtom,
    updateSavedClusterAtom,
} from '../cluster-storage';

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

        it('should keep two endpoints that share a name', () => {
            const store = createStore();
            store.set(addSavedClusterAtom, { name: 'Local', url: 'http://localhost:8899' });
            store.set(addSavedClusterAtom, { name: 'Local', url: 'http://localhost:9999' });
            expect(store.get(savedClustersAtom)).toEqual([
                { name: 'Local', url: 'http://localhost:8899' },
                { name: 'Local', url: 'http://localhost:9999' },
            ]);
        });

        it('should replace an entry saved again under the same URL', () => {
            const store = createStore();
            store.set(addSavedClusterAtom, { name: 'Local', url: 'http://localhost:8899' });
            store.set(addSavedClusterAtom, { name: 'Also Local', url: 'http://localhost:8899' });
            expect(store.get(savedClustersAtom)).toEqual([{ name: 'Also Local', url: 'http://localhost:8899' }]);
        });

        // The one-click save from the navbar's field: kept now, named later.
        it('should save an endpoint with no name', () => {
            const store = createStore();
            store.set(addSavedClusterAtom, { name: '', url: 'http://localhost:8899' });
            expect(store.get(savedClustersAtom)).toEqual([{ name: '', url: 'http://localhost:8899' }]);
        });
    });

    describe('removeSavedClusterAtom', () => {
        it('should remove a cluster by URL', () => {
            const store = createStore();
            store.set(addSavedClusterAtom, { name: 'Local', url: 'http://localhost:8899' });
            store.set(addSavedClusterAtom, { name: 'Staging', url: 'http://staging.example.com' });
            store.set(removeSavedClusterAtom, 'http://localhost:8899');
            expect(store.get(savedClustersAtom)).toEqual([{ name: 'Staging', url: 'http://staging.example.com' }]);
        });

        it('should remove an unnamed entry, which no name could address', () => {
            const store = createStore();
            store.set(addSavedClusterAtom, { name: '', url: 'http://localhost:8899' });
            store.set(removeSavedClusterAtom, 'http://localhost:8899');
            expect(store.get(savedClustersAtom)).toEqual([]);
        });

        it('should do nothing when the URL is not in the list', () => {
            const store = createStore();
            store.set(addSavedClusterAtom, { name: 'Local', url: 'http://localhost:8899' });
            store.set(removeSavedClusterAtom, 'http://localhost:9999');
            expect(store.get(savedClustersAtom)).toHaveLength(1);
        });
    });

    describe('updateSavedClusterAtom', () => {
        function storeWithTwo() {
            const store = createStore();
            store.set(addSavedClusterAtom, { name: '', url: 'http://localhost:8899' });
            store.set(addSavedClusterAtom, { name: 'Staging', url: 'http://staging.example.com' });
            return store;
        }

        it('should name an entry that was saved without one', () => {
            const store = storeWithTwo();
            store.set(updateSavedClusterAtom, { name: 'My validator', url: 'http://localhost:8899' });
            expect(store.get(savedClustersAtom)).toContainEqual({
                name: 'My validator',
                url: 'http://localhost:8899',
            });
        });

        it('should keep the entry where it was in the list', () => {
            const store = storeWithTwo();
            store.set(updateSavedClusterAtom, { name: 'My validator', url: 'http://localhost:8899' });
            expect(store.get(savedClustersAtom).map(c => c.name)).toEqual(['My validator', 'Staging']);
        });

        it('should normalize the new name the way a save does', () => {
            const store = storeWithTwo();
            store.set(updateSavedClusterAtom, { name: `  ${'x'.repeat(200)}  `, url: 'http://localhost:8899' });
            expect(store.get(savedClustersAtom)[0].name).toBe('x'.repeat(MAX_CLUSTER_NAME_LENGTH));
        });

        // Blank is a name the UI produces on purpose: naming is optional, and clearing it puts the entry
        // back to being known by its host.
        it('should accept a name cleared back to nothing', () => {
            const store = storeWithTwo();
            store.set(updateSavedClusterAtom, { name: '   ', url: 'http://staging.example.com' });
            expect(store.get(savedClustersAtom)).toContainEqual({ name: '', url: 'http://staging.example.com' });
        });

        it('should allow a name another entry already holds, since the URL is the identity', () => {
            const store = storeWithTwo();
            store.set(updateSavedClusterAtom, { name: 'Staging', url: 'http://localhost:8899' });
            expect(store.get(savedClustersAtom).map(c => c.name)).toEqual(['Staging', 'Staging']);
        });

        // The other half of an entry: a typo in the address used to mean deleting it and saving again.
        it('should change the address, keeping the entry in place', () => {
            const store = storeWithTwo();
            store.set(updateSavedClusterAtom, {
                name: 'Local',
                nextUrl: 'http://localhost:9999',
                url: 'http://localhost:8899',
            });
            expect(store.get(savedClustersAtom)).toEqual([
                { name: 'Local', url: 'http://localhost:9999' },
                { name: 'Staging', url: 'http://staging.example.com' },
            ]);
        });

        it('should refuse an address that is not an RPC endpoint', () => {
            const store = storeWithTwo();
            expect(() =>
                store.set(updateSavedClusterAtom, {
                    name: 'Local',
                    nextUrl: 'localhost:9999',
                    url: 'http://localhost:8899',
                }),
            ).toThrow('That is not a full RPC URL.');
            expect(store.get(savedClustersAtom)[0].url).toBe('http://localhost:8899');
        });

        it('should refuse an address another entry already holds', () => {
            const store = storeWithTwo();
            expect(() =>
                store.set(updateSavedClusterAtom, {
                    name: 'Local',
                    nextUrl: 'http://staging.example.com',
                    url: 'http://localhost:8899',
                }),
            ).toThrow('Another saved endpoint has that address.');
            expect(store.get(savedClustersAtom)).toHaveLength(2);
        });

        it('should do nothing when the URL is not in the list', () => {
            const store = storeWithTwo();
            store.set(updateSavedClusterAtom, { name: 'Whatever', url: 'http://localhost:9999' });
            expect(store.get(savedClustersAtom).map(c => c.name)).toEqual(['', 'Staging']);
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
            ['a null entry', null],
            ['a string entry', 'http://localhost:8899'],
        ])('should drop an entry with %s', (_label, entry) => {
            expect(parseSavedClusters([entry])).toEqual([]);
        });

        // An entry saved from the field and never named. Kept, with the blank normalized like any other
        // name, because the list shows such an entry by its host.
        it('should keep an entry whose name is blank', () => {
            expect(parseSavedClusters([{ name: '   ', url: 'http://localhost:8899' }])).toEqual([
                { name: '', url: 'http://localhost:8899' },
            ]);
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

        it('should keep both entries when two share a name', () => {
            expect(
                parseSavedClusters([
                    { name: 'Local', url: 'http://localhost:8899' },
                    { name: 'Local', url: 'http://localhost:9999' },
                ]),
            ).toEqual([
                { name: 'Local', url: 'http://localhost:8899' },
                { name: 'Local', url: 'http://localhost:9999' },
            ]);
        });

        it('should keep the last entry when two share a URL', () => {
            expect(
                parseSavedClusters([
                    { name: 'Old label', url: 'http://localhost:8899' },
                    { name: 'New label', url: 'http://localhost:8899' },
                ]),
            ).toEqual([{ name: 'New label', url: 'http://localhost:8899' }]);
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
            store.set(removeSavedClusterAtom, 'http://localhost:9999');
            expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '')).toEqual([
                { name: 'Local', url: 'http://localhost:8899' },
            ]);
        });
    });
});
