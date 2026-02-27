import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface SavedCluster {
    name: string;
    url: string;
}

export const SAVED_CLUSTER_PREFIX = 'custom:';

export const persistedClusterAtom = atomWithStorage<string | null>(
    'explorer:selectedCluster',
    null,
    undefined,
    { getOnInit: true }
);

export const savedClustersAtom = atomWithStorage<SavedCluster[]>(
    'explorer:savedClusters',
    [],
    undefined,
    { getOnInit: true }
);

export const addSavedClusterAtom = atom(null, (get, set, cluster: SavedCluster) => {
    set(savedClustersAtom, [...get(savedClustersAtom).filter(c => c.name !== cluster.name), cluster]);
});

export const removeSavedClusterAtom = atom(null, (get, set, name: string) => {
    set(
        savedClustersAtom,
        get(savedClustersAtom).filter(c => c.name !== name)
    );
});

export function findSavedClusterUrl(clusters: SavedCluster[], persistedSlug: string): string | undefined {
    if (!persistedSlug.startsWith(SAVED_CLUSTER_PREFIX)) return undefined;
    const name = persistedSlug.slice(SAVED_CLUSTER_PREFIX.length);
    return clusters.find(c => c.name === name)?.url;
}
