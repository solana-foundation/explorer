import { createStore } from 'jotai';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
    addSavedClusterAtom,
    findSavedClusterUrl,
    persistedClusterAtom,
    removeSavedClusterAtom,
    savedClustersAtom,
} from '../cluster-storage';

describe('cluster-storage atoms', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('persistedClusterAtom', () => {
        it('defaults to null', () => {
            const store = createStore();
            expect(store.get(persistedClusterAtom)).toBeNull();
        });

        it('stores and returns a cluster slug', () => {
            const store = createStore();
            store.set(persistedClusterAtom, 'devnet');
            expect(store.get(persistedClusterAtom)).toBe('devnet');
        });

        it('overwrites a previous value', () => {
            const store = createStore();
            store.set(persistedClusterAtom, 'devnet');
            store.set(persistedClusterAtom, 'testnet');
            expect(store.get(persistedClusterAtom)).toBe('testnet');
        });

        it('removes the key when set to null', () => {
            const store = createStore();
            store.set(persistedClusterAtom, 'devnet');
            store.set(persistedClusterAtom, null);
            expect(store.get(persistedClusterAtom)).toBeNull();
        });
    });

    describe('savedClustersAtom', () => {
        it('defaults to empty array', () => {
            const store = createStore();
            expect(store.get(savedClustersAtom)).toEqual([]);
        });
    });

    describe('addSavedClusterAtom', () => {
        it('adds a cluster to an empty list', () => {
            const store = createStore();
            store.set(addSavedClusterAtom, { name: 'Local', url: 'http://localhost:8899' });
            expect(store.get(savedClustersAtom)).toEqual([{ name: 'Local', url: 'http://localhost:8899' }]);
        });

        it('appends to existing clusters', () => {
            const store = createStore();
            store.set(addSavedClusterAtom, { name: 'Local', url: 'http://localhost:8899' });
            store.set(addSavedClusterAtom, { name: 'Staging', url: 'http://staging.example.com' });
            expect(store.get(savedClustersAtom)).toHaveLength(2);
            expect(store.get(savedClustersAtom)[1].name).toBe('Staging');
        });

        it('replaces an existing cluster with the same name', () => {
            const store = createStore();
            store.set(addSavedClusterAtom, { name: 'Local', url: 'http://localhost:8899' });
            store.set(addSavedClusterAtom, { name: 'Local', url: 'http://localhost:9999' });
            expect(store.get(savedClustersAtom)).toEqual([{ name: 'Local', url: 'http://localhost:9999' }]);
        });

        it('allows the same URL under different names', () => {
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
        it('removes a cluster by name', () => {
            const store = createStore();
            store.set(addSavedClusterAtom, { name: 'Local', url: 'http://localhost:8899' });
            store.set(addSavedClusterAtom, { name: 'Staging', url: 'http://staging.example.com' });
            store.set(removeSavedClusterAtom, 'Local');
            expect(store.get(savedClustersAtom)).toEqual([{ name: 'Staging', url: 'http://staging.example.com' }]);
        });

        it('produces an empty list when removing the last cluster', () => {
            const store = createStore();
            store.set(addSavedClusterAtom, { name: 'Local', url: 'http://localhost:8899' });
            store.set(removeSavedClusterAtom, 'Local');
            expect(store.get(savedClustersAtom)).toEqual([]);
        });

        it('does nothing when name does not exist', () => {
            const store = createStore();
            store.set(addSavedClusterAtom, { name: 'Local', url: 'http://localhost:8899' });
            store.set(removeSavedClusterAtom, 'Nonexistent');
            expect(store.get(savedClustersAtom)).toHaveLength(1);
        });
    });

    describe('findSavedClusterUrl', () => {
        it('returns the URL for a matching saved cluster', () => {
            const clusters = [{ name: 'Local', url: 'http://localhost:8899' }];
            expect(findSavedClusterUrl(clusters, 'custom:Local')).toBe('http://localhost:8899');
        });

        it('returns undefined for a slug without the custom: prefix', () => {
            const clusters = [{ name: 'Local', url: 'http://localhost:8899' }];
            expect(findSavedClusterUrl(clusters, 'devnet')).toBeUndefined();
        });

        it('returns undefined when the named cluster does not exist', () => {
            expect(findSavedClusterUrl([], 'custom:Nonexistent')).toBeUndefined();
        });
    });
});
