import { parseRpcEndpoint } from '@entities/cluster';
import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

import { normalizeClusterName } from './cluster-name';

export interface SavedCluster {
    name: string;
    url: string;
}

const STORAGE_KEY = 'explorer:savedClusters';

export function parseSavedClusters(value: unknown): SavedCluster[] {
    if (!Array.isArray(value)) return [];
    const byUrl = new Map<string, SavedCluster>();
    for (const entry of value) {
        const cluster = parseSavedCluster(entry);
        if (cluster) byUrl.set(cluster.url, cluster);
    }
    return [...byUrl.values()];
}

function parseSavedCluster(value: unknown): SavedCluster | undefined {
    if (typeof value !== 'object' || value === null) return undefined;
    const { name, url } = value as Partial<Record<keyof SavedCluster, unknown>>;
    if (typeof name !== 'string' || typeof url !== 'string') return undefined;
    const clusterName = normalizeClusterName(name);
    if (!parseRpcEndpoint(url)) return undefined;
    return { name: clusterName, url };
}

const jsonStorage = createJSONStorage<SavedCluster[]>();
const { subscribe } = jsonStorage;
const validatedStorage: typeof jsonStorage = {
    getItem: (key, initialValue) => parseSavedClusters(jsonStorage.getItem(key, initialValue)),
    removeItem: key => jsonStorage.removeItem(key),
    setItem: (key, newValue) => jsonStorage.setItem(key, newValue),
    subscribe:
        subscribe &&
        ((key, callback, initialValue) => subscribe(key, v => callback(parseSavedClusters(v)), initialValue)),
};

export const savedClustersAtom = atomWithStorage<SavedCluster[]>(STORAGE_KEY, [], validatedStorage);

export const addSavedClusterAtom = atom(undefined, (get, set, cluster: SavedCluster) => {
    set(savedClustersAtom, [...excludeByUrl(get(savedClustersAtom), cluster.url), cluster]);
});

export const removeSavedClusterAtom = atom(undefined, (get, set, url: string) => {
    set(savedClustersAtom, excludeByUrl(get(savedClustersAtom), url));
});

export const updateSavedClusterAtom = atom(
    undefined,
    (get, set, edit: { name: string; nextUrl?: string; url: string }) => {
        const clusters = get(savedClustersAtom);
        if (!clusters.some(c => c.url === edit.url)) return;
        const name = normalizeClusterName(edit.name);
        const nextUrl = edit.nextUrl ?? edit.url;
        if (nextUrl !== edit.url) {
            if (!parseRpcEndpoint(nextUrl)) throw new Error('That is not a full RPC URL.');
            if (clusters.some(c => c.url === nextUrl)) throw new Error('Another saved endpoint has that address.');
        }
        set(
            savedClustersAtom,
            clusters.map(c => (c.url === edit.url ? { name, url: nextUrl } : c)),
        );
    },
);

function excludeByUrl(clusters: SavedCluster[], url: string): SavedCluster[] {
    return clusters.filter(c => c.url !== url);
}
