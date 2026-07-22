'use client';

import { useSetAtom } from 'jotai';
import { useContext } from 'react';

import { clusterName, clusterUrl } from '../lib/cluster';
import { StateContext } from './cluster-provider';
import { rememberedCustomUrlAtom } from './cluster-storage';

export function useCluster() {
    const context = useContext(StateContext);
    if (!context) {
        throw new Error(`useCluster must be used within a ClusterProvider`);
    }
    return {
        ...context,
        name: clusterName(context.cluster),
        url: clusterUrl(context.cluster, context.customUrl),
    };
}

export function useUpdateCustomUrl() {
    return useSetAtom(rememberedCustomUrlAtom);
}
