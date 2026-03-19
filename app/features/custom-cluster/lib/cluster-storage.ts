import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface SavedCluster {
    name: string;
    url: string;
}

const STORAGE_KEY = 'explorer:savedClusters';

function excludeByName(clusters: SavedCluster[], name: string): SavedCluster[] {
    return clusters.filter(c => c.name !== name);
}

export const savedClustersAtom = atomWithStorage<SavedCluster[]>(STORAGE_KEY, []);

export const addSavedClusterAtom = atom(null, (get, set, cluster: SavedCluster) => {
    const next = [...excludeByName(get(savedClustersAtom), cluster.name), cluster];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    set(savedClustersAtom, next);
});

export const removeSavedClusterAtom = atom(null, (get, set, name: string) => {
    const next = excludeByName(get(savedClustersAtom), name);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    set(savedClustersAtom, next);
});
