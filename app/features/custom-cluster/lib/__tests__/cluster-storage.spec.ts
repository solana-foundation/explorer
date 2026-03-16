import { createStore } from 'jotai';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { addSavedClusterAtom, removeSavedClusterAtom, savedClustersAtom } from '../cluster-storage';

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
});
