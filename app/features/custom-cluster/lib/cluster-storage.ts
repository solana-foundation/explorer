import { localStorageIsAvailable } from '@utils/local-storage';

export interface SavedCluster {
    name: string;
    url: string;
}

const SELECTED_CLUSTER_KEY = 'explorer:selectedCluster';
const SAVED_CLUSTERS_KEY = 'explorer:savedClusters';
export const SAVED_CLUSTER_PREFIX = 'custom:';

export function getPersistedCluster(): string | null {
    if (!localStorageIsAvailable()) return null;
    return localStorage.getItem(SELECTED_CLUSTER_KEY);
}

export function setPersistedCluster(slug: string): void {
    if (!localStorageIsAvailable()) return;
    localStorage.setItem(SELECTED_CLUSTER_KEY, slug);
}

export function getSavedClusters(): SavedCluster[] {
    if (!localStorageIsAvailable()) return [];
    try {
        const raw = localStorage.getItem(SAVED_CLUSTERS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            localStorage.removeItem(SAVED_CLUSTERS_KEY);
            return [];
        }
        return parsed;
    } catch {
        localStorage.removeItem(SAVED_CLUSTERS_KEY);
        return [];
    }
}

export function addSavedCluster(cluster: SavedCluster): void {
    if (!localStorageIsAvailable()) return;
    const clusters = getSavedClusters().filter(c => c.name !== cluster.name);
    clusters.push(cluster);
    localStorage.setItem(SAVED_CLUSTERS_KEY, JSON.stringify(clusters));
}

export function removeSavedCluster(name: string): void {
    if (!localStorageIsAvailable()) return;
    const clusters = getSavedClusters();
    const filtered = clusters.filter(c => c.name !== name);
    localStorage.setItem(SAVED_CLUSTERS_KEY, JSON.stringify(filtered));
}

export function findSavedClusterUrl(persistedSlug: string): string | undefined {
    if (!persistedSlug.startsWith(SAVED_CLUSTER_PREFIX)) return undefined;
    const name = persistedSlug.slice(SAVED_CLUSTER_PREFIX.length);
    return getSavedClusters().find(c => c.name === name)?.url;
}
