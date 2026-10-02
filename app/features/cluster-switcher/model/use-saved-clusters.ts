import 'client-only';

import { useAtomValue, useSetAtom } from 'jotai';

import {
    addSavedClusterAtom,
    removeSavedClusterAtom,
    restoreSavedClusterAtom,
    type SavedCluster,
    savedClustersAtom,
    updateSavedClusterAtom,
} from '../lib/cluster-storage';

export type { SavedCluster };

export function useSavedClusters() {
    return {
        addSavedCluster: useSetAtom(addSavedClusterAtom),
        removeSavedCluster: useSetAtom(removeSavedClusterAtom),
        restoreSavedCluster: useSetAtom(restoreSavedClusterAtom),
        savedClusters: useAtomValue(savedClustersAtom),
        updateSavedCluster: useSetAtom(updateSavedClusterAtom),
    };
}
