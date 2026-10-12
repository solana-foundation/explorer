import { parseRpcEndpoint } from '@entities/cluster';
import { atom, type Getter, type Setter } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

import { Logger } from '@/app/shared/lib/logger';

import { normalizeClusterName } from './cluster-name';

export interface SavedCluster {
    name: string;
    url: string;
}

const STORAGE_KEY = 'explorer:savedClusters';

export function parseSavedClusters(value: unknown): SavedCluster[] {
    if (!Array.isArray(value)) return [];
    // The URL is the identity, so older data holding one URL under two names keeps the latest name only.
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

// Both reads are wrapped because jotai's cross-tab `subscribe` skips `getItem`; `unstable_withStorageValidator`
// would discard the whole list over one bad entry and leaves `subscribe` unchecked.
const jsonStorage = createJSONStorage<SavedCluster[]>();
const { subscribe } = jsonStorage;
const validatedStorage: typeof jsonStorage = {
    getItem: (key, initialValue) => parseSavedClusters(jsonStorage.getItem(key, initialValue)),
    removeItem: key => jsonStorage.removeItem(key),
    setItem: (key, newValue) => jsonStorage.setItem(key, newValue),
    // Absent outside the browser: jotai checks the property before subscribing.
    subscribe:
        subscribe &&
        ((key, callback, initialValue) => subscribe(key, v => callback(parseSavedClusters(v)), initialValue)),
};

export const savedClustersAtom = atomWithStorage<SavedCluster[]>(STORAGE_KEY, [], validatedStorage);

export const addSavedClusterAtom = atom(undefined, (get, set, cluster: SavedCluster) => {
    persist(get, set, [...excludeByUrl(get(savedClustersAtom), cluster.url), cluster]);
});

export const removeSavedClusterAtom = atom(undefined, (get, set, url: string) => {
    persist(get, set, excludeByUrl(get(savedClustersAtom), url));
});

/** Maps a failed save to the message the form shows, and logs it. */
export function describeSaveError(error: unknown): string {
    Logger.error(error);
    return error instanceof DOMException && error.name === 'QuotaExceededError'
        ? 'Not enough storage space to save this endpoint. Try removing unused ones.'
        : 'Could not save this endpoint.';
}

export const updateSavedClusterAtom = atom(
    undefined,
    (get, set, edit: { name: string; nextUrl?: string; url: string }) => {
        const clusters = get(savedClustersAtom);
        // Another tab can delete the entry while this tab's rename form is open.
        if (!clusters.some(c => c.url === edit.url)) throw new Error('That endpoint is no longer saved.');
        const name = normalizeClusterName(edit.name);
        const nextUrl = edit.nextUrl ?? edit.url;
        if (nextUrl !== edit.url) {
            if (!parseRpcEndpoint(nextUrl)) throw new Error('That is not a full RPC URL.');
            if (clusters.some(c => c.url === nextUrl)) throw new Error('Another saved endpoint has that address.');
        }
        persist(
            get,
            set,
            clusters.map(c => (c.url === edit.url ? { name, url: nextUrl } : c)),
        );
    },
);

// atomWithStorage updates memory before storage.setItem throws, so a failed write would otherwise stay on screen.
function persist(get: Getter, set: Setter, next: SavedCluster[]) {
    const previous = get(savedClustersAtom);
    try {
        set(savedClustersAtom, next);
    } catch (error) {
        set(savedClustersAtom, previous);
        throw error;
    }
}

function excludeByUrl(clusters: SavedCluster[], url: string): SavedCluster[] {
    return clusters.filter(c => c.url !== url);
}
