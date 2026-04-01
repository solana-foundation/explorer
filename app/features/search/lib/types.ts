import type { Cluster } from '@utils/cluster';

export type SearchItem = {
    label: string;
    value: string[];
    pathname: string;
    /** When set, overrides the current cluster context during navigation. */
    cluster?: Cluster;
    icon?: string;
    verified?: boolean;
};

export interface SearchOptions {
    label: string;
    options: SearchItem[];
}

export type SearchContext = {
    cluster: Cluster;
    currentEpoch: bigint | undefined;
};

export interface SearchProvider {
    readonly name: string;
    /** Where the results come from: known data, raw user input, or a network call. */
    readonly kind: 'local' | 'fallback' | 'remote';
    /** Display priority within the tier — higher values appear first. */
    readonly priority: number;
    search(query: string, ctx: SearchContext): SearchOptions[] | Promise<SearchOptions[]>;
}

export interface SearchProviderRegistry {
    local: SearchProvider[];
    fallback: SearchProvider[];
    remote: SearchProvider[];
}
