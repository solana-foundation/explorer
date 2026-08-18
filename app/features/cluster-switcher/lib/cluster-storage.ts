import { parseRpcEndpoint } from '@entities/cluster';
import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

import { normalizeClusterName } from './cluster-name';

export interface SavedCluster {
    name: string;
    url: string;
}

const STORAGE_KEY = 'explorer:savedClusters';

/**
 * What comes back from localStorage is `unknown`: the key is editable by hand and outlives any format
 * this app ships. Two failures this prevents — a root that is not an array throws on `.map` and takes the
 * modal down, and an entry whose URL is not an RPC endpoint renders a button that goes nowhere, since the
 * reader refuses the value on arrival and strips it back out of the query string.
 *
 * Nothing is written back: the next add or remove persists this list, so a bad entry clears itself
 * without opening the switcher having a side effect on the user's storage.
 */
export function parseSavedClusters(value: unknown): SavedCluster[] {
    if (!Array.isArray(value)) return [];
    // By name, because the name is both the React key and the handle `removeSavedClusterAtom` deletes by:
    // a duplicate leaves one of the pair impossible to remove on its own. Last one wins, matching what
    // `addSavedClusterAtom` does with a repeated name.
    const byName = new Map<string, SavedCluster>();
    for (const entry of value) {
        const cluster = parseSavedCluster(entry);
        if (cluster) byName.set(cluster.name, cluster);
    }
    return [...byName.values()];
}

function parseSavedCluster(value: unknown): SavedCluster | undefined {
    if (typeof value !== 'object' || value === null) return undefined;
    const { name, url } = value as Partial<Record<keyof SavedCluster, unknown>>;
    if (typeof name !== 'string' || typeof url !== 'string') return undefined;
    // Normalized to match what the save form stores, so storage cannot hold a name the form could never
    // produce: blank and rendering as an unlabelled button, or long enough to truncate to nothing on the
    // pill. Capped rather than dropped, since the URL is the part that carries the value.
    const clusterName = normalizeClusterName(name);
    // The same check the save form and the reader apply. Storage is the one input that reaches the
    // switcher without passing either.
    if (clusterName === '' || !parseRpcEndpoint(url)) return undefined;
    return { name: clusterName, url };
}

// jotai's JSON storage parses but never checks, and its cross-tab `subscribe` path parses the raw storage
// event instead of going back through `getItem`. Both are wrapped, so no route into the atom skips the
// check. Not `unstable_withStorageValidator`: it is all-or-nothing — one bad entry discards the whole
// list — and it leaves `subscribe` unwrapped.
const jsonStorage = createJSONStorage<SavedCluster[]>();
const { subscribe } = jsonStorage;
const validatedStorage: typeof jsonStorage = {
    getItem: (key, initialValue) => parseSavedClusters(jsonStorage.getItem(key, initialValue)),
    removeItem: key => jsonStorage.removeItem(key),
    setItem: (key, newValue) => jsonStorage.setItem(key, newValue),
    // jotai checks the property before subscribing, so outside the browser it has to stay absent rather
    // than become a wrapper around nothing.
    subscribe:
        subscribe &&
        ((key, callback, initialValue) => subscribe(key, v => callback(parseSavedClusters(v)), initialValue)),
};

export const savedClustersAtom = atomWithStorage<SavedCluster[]>(STORAGE_KEY, [], validatedStorage);

// Write-only atoms: jotai treats any non-function first argument as the initial read value, so
// `undefined` means these hold no readable state and exist only for their write function.
export const addSavedClusterAtom = atom(undefined, (get, set, cluster: SavedCluster) => {
    set(savedClustersAtom, [...excludeByName(get(savedClustersAtom), cluster.name), cluster]);
});

export const removeSavedClusterAtom = atom(undefined, (get, set, name: string) => {
    set(savedClustersAtom, excludeByName(get(savedClustersAtom), name));
});

function excludeByName(clusters: SavedCluster[], name: string): SavedCluster[] {
    return clusters.filter(c => c.name !== name);
}
