import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface SavedCluster {
    name: string;
    url: string;
}

export const savedClustersAtom = atomWithStorage<SavedCluster[]>('explorer:savedClusters', [], undefined, {
    getOnInit: true,
});

export const addSavedClusterAtom = atom(null, (get, set, cluster: SavedCluster) => {
    set(savedClustersAtom, [...get(savedClustersAtom).filter(c => c.name !== cluster.name), cluster]);
});

export const removeSavedClusterAtom = atom(null, (get, set, name: string) => {
    set(
        savedClustersAtom,
        get(savedClustersAtom).filter(c => c.name !== name)
    );
});
