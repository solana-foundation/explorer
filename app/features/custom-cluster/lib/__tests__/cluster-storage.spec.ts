import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    addSavedCluster,
    findSavedClusterUrl,
    getPersistedCluster,
    getSavedClusters,
    removeSavedCluster,
    setPersistedCluster,
} from '../cluster-storage';

vi.mock('@utils/local-storage', () => ({
    localStorageIsAvailable: vi.fn(() => true),
}));

import { localStorageIsAvailable } from '@utils/local-storage';

describe('cluster-storage', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(localStorageIsAvailable).mockReturnValue(true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getPersistedCluster', () => {
        it('returns null when no cluster is stored', () => {
            expect(getPersistedCluster()).toBeNull();
        });

        it('returns the stored cluster slug', () => {
            localStorage.setItem('explorer:selectedCluster', 'devnet');
            expect(getPersistedCluster()).toBe('devnet');
        });

        it('returns null when localStorage is unavailable', () => {
            vi.mocked(localStorageIsAvailable).mockReturnValue(false);
            localStorage.setItem('explorer:selectedCluster', 'devnet');
            expect(getPersistedCluster()).toBeNull();
        });
    });

    describe('setPersistedCluster', () => {
        it('writes the cluster slug to localStorage', () => {
            setPersistedCluster('testnet');
            expect(localStorage.getItem('explorer:selectedCluster')).toBe('testnet');
        });

        it('overwrites a previous value', () => {
            setPersistedCluster('devnet');
            setPersistedCluster('testnet');
            expect(localStorage.getItem('explorer:selectedCluster')).toBe('testnet');
        });

        it('does nothing when localStorage is unavailable', () => {
            vi.mocked(localStorageIsAvailable).mockReturnValue(false);
            setPersistedCluster('devnet');
            expect(localStorage.getItem('explorer:selectedCluster')).toBeNull();
        });
    });

    describe('getSavedClusters', () => {
        it('returns empty array when nothing is stored', () => {
            expect(getSavedClusters()).toEqual([]);
        });

        it('returns parsed array of saved clusters', () => {
            const clusters = [{ name: 'Local', url: 'http://localhost:8899' }];
            localStorage.setItem('explorer:savedClusters', JSON.stringify(clusters));
            expect(getSavedClusters()).toEqual(clusters);
        });

        it('returns empty array and clears key on corrupted JSON', () => {
            localStorage.setItem('explorer:savedClusters', 'not-json');
            expect(getSavedClusters()).toEqual([]);
            expect(localStorage.getItem('explorer:savedClusters')).toBeNull();
        });

        it('returns empty array and clears key when stored value is not an array', () => {
            localStorage.setItem('explorer:savedClusters', JSON.stringify({ name: 'test' }));
            expect(getSavedClusters()).toEqual([]);
            expect(localStorage.getItem('explorer:savedClusters')).toBeNull();
        });

        it('returns empty array when localStorage is unavailable', () => {
            vi.mocked(localStorageIsAvailable).mockReturnValue(false);
            expect(getSavedClusters()).toEqual([]);
        });
    });

    describe('addSavedCluster', () => {
        it('adds a cluster to an empty list', () => {
            addSavedCluster({ name: 'Local', url: 'http://localhost:8899' });
            expect(getSavedClusters()).toEqual([{ name: 'Local', url: 'http://localhost:8899' }]);
        });

        it('appends to existing clusters', () => {
            addSavedCluster({ name: 'Local', url: 'http://localhost:8899' });
            addSavedCluster({ name: 'Staging', url: 'http://staging.example.com' });
            expect(getSavedClusters()).toHaveLength(2);
            expect(getSavedClusters()[1].name).toBe('Staging');
        });

        it('replaces an existing cluster with the same name', () => {
            addSavedCluster({ name: 'Local', url: 'http://localhost:8899' });
            addSavedCluster({ name: 'Local', url: 'http://localhost:9999' });
            expect(getSavedClusters()).toEqual([{ name: 'Local', url: 'http://localhost:9999' }]);
        });

        it('does nothing when localStorage is unavailable', () => {
            vi.mocked(localStorageIsAvailable).mockReturnValue(false);
            addSavedCluster({ name: 'Local', url: 'http://localhost:8899' });
            vi.mocked(localStorageIsAvailable).mockReturnValue(true);
            expect(getSavedClusters()).toEqual([]);
        });
    });

    describe('removeSavedCluster', () => {
        it('removes a cluster by name', () => {
            addSavedCluster({ name: 'Local', url: 'http://localhost:8899' });
            addSavedCluster({ name: 'Staging', url: 'http://staging.example.com' });
            removeSavedCluster('Local');
            expect(getSavedClusters()).toEqual([{ name: 'Staging', url: 'http://staging.example.com' }]);
        });

        it('does nothing when name does not exist', () => {
            addSavedCluster({ name: 'Local', url: 'http://localhost:8899' });
            removeSavedCluster('Nonexistent');
            expect(getSavedClusters()).toHaveLength(1);
        });

        it('does nothing when localStorage is unavailable', () => {
            addSavedCluster({ name: 'Local', url: 'http://localhost:8899' });
            vi.mocked(localStorageIsAvailable).mockReturnValue(false);
            removeSavedCluster('Local');
            vi.mocked(localStorageIsAvailable).mockReturnValue(true);
            expect(getSavedClusters()).toHaveLength(1);
        });
    });

    describe('findSavedClusterUrl', () => {
        it('returns the URL for a matching saved cluster', () => {
            addSavedCluster({ name: 'Local', url: 'http://localhost:8899' });
            expect(findSavedClusterUrl('custom:Local')).toBe('http://localhost:8899');
        });

        it('returns undefined for a slug without the custom: prefix', () => {
            addSavedCluster({ name: 'Local', url: 'http://localhost:8899' });
            expect(findSavedClusterUrl('devnet')).toBeUndefined();
        });

        it('returns undefined when the named cluster does not exist', () => {
            expect(findSavedClusterUrl('custom:Nonexistent')).toBeUndefined();
        });
    });
});
