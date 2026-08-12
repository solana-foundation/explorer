// Clusters the inspector can query — the single source of truth for the SupportedCluster type.
export const SUPPORTED_CLUSTERS = ['mainnet-beta', 'devnet', 'testnet', 'simd296'] as const;

export type SupportedCluster = (typeof SUPPORTED_CLUSTERS)[number];

/**
 * A deployment's live subset of SUPPORTED_CLUSTERS. The non-empty tuple shape is load-bearing: `z.enum` only accepts
 * `readonly [string, ...string[]]`, and it lets `defaultCluster` index `[0]` without a non-null assertion.
 */
export type EnabledClusters = readonly [SupportedCluster, ...SupportedCluster[]];

export const DEFAULT_CLUSTER: SupportedCluster = 'mainnet-beta';
