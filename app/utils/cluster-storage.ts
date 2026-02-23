import { localStorageIsAvailable } from './local-storage';

export interface SavedCluster {
    name: string;
    url: string;
}

const SELECTED_CLUSTER_KEY = 'explorer:selectedCluster';
const SAVED_CLUSTERS_KEY = 'explorer:savedClusters';

export function getPersistedCluster(): string | null {
    if (!localStorageIsAvailable()) return null;
    try {
        return localStorage.getItem(SELECTED_CLUSTER_KEY);
    } catch {
        return null;
    }
}

export function setPersistedCluster(clusterSlug: string): void {
    if (!localStorageIsAvailable()) return;
    try {
        localStorage.setItem(SELECTED_CLUSTER_KEY, clusterSlug);
    } catch {
        // Silently fail if storage is full or unavailable
    }
}

export function clearPersistedCluster(): void {
    if (!localStorageIsAvailable()) return;
    try {
        localStorage.removeItem(SELECTED_CLUSTER_KEY);
    } catch {
        // Silently fail
    }
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
    try {
        const clusters = getSavedClusters();
        clusters.push(cluster);
        localStorage.setItem(SAVED_CLUSTERS_KEY, JSON.stringify(clusters));
    } catch {
        // Silently fail
    }
}

export function removeSavedCluster(name: string): void {
    if (!localStorageIsAvailable()) return;
    try {
        const clusters = getSavedClusters();
        const filtered = clusters.filter(c => c.name !== name);
        localStorage.setItem(SAVED_CLUSTERS_KEY, JSON.stringify(filtered));
    } catch {
        // Silently fail
    }
}
