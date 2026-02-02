import { Cluster } from '@/app/utils/cluster';

// Clusters that can be specified via URL query param (non-mainnet)
export type QueryCluster = Cluster.Devnet | Cluster.Testnet | Cluster.Simd296;

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Extract cluster param from search params, handling Slack's HTML encoding bug.
 *
 * Slack's unfurler HTML-encodes `&` as `&amp;` in URLs before requesting them,
 * so `?view=receipt&cluster=devnet` becomes `?view=receipt&amp;cluster=devnet`.
 * This causes the server to parse it as `{ view: 'receipt', 'amp;cluster': 'devnet' }`.
 *
 * @see https://github.com/nicholasgriffintn/slack-unfurl-bug (community reports of this issue)
 */
export function getClusterParam(searchParams: SearchParams): string | undefined {
    const value = searchParams.cluster ?? searchParams['amp;cluster'];
    return typeof value === 'string' ? value : undefined;
}

export function parseClusterId(value: string | undefined): QueryCluster | undefined {
    if (value === undefined) return value;
    const id = Number(value);
    if (id === Cluster.Devnet || id === Cluster.Testnet || id === Cluster.Simd296) {
        return id;
    }
    return undefined;
}
