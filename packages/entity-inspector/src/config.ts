// Clusters the inspector can query — the single source of truth for the SupportedCluster type.
export const SUPPORTED_CLUSTERS = ['mainnet-beta', 'devnet', 'testnet', 'simd296'] as const;

export type SupportedCluster = (typeof SUPPORTED_CLUSTERS)[number];
