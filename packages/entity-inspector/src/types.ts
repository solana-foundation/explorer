import type { InspectorLogger } from './logger.js';

export const SUPPORTED_CLUSTERS = ['mainnet-beta', 'devnet', 'testnet', 'simd296'] as const;

export type SupportedCluster = (typeof SUPPORTED_CLUSTERS)[number];

export type EntityInspectorConfig = {
    logger?: InspectorLogger;
    rpcEndpoints: Record<SupportedCluster, string>;
};
