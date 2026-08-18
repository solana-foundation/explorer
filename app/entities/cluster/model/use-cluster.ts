'use client';

import { useContext } from 'react';

import { clusterName, clusterUrl } from '../lib/cluster';
import { StateContext } from './cluster-provider';

export function useCluster() {
    const context = useContext(StateContext);
    if (!context) {
        throw new Error(`useCluster must be used within a ClusterProvider`);
    }
    return {
        ...context,
        // Flattened so consumers that want only `cluster`, or only `endpoint`, read it directly. These
        // are copies of one selection and cannot disagree; anything needing both takes `selection` whole.
        ...context.selection,
        name: clusterName(context.selection.cluster),
        url: clusterUrl(context.selection),
    };
}
