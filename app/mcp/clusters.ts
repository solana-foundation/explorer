import type { SupportedCluster } from '@explorer/entity-inspector';

// Clusters /mcp accepts, and the single source the landing page reads. Listed rather than aliased to
// SUPPORTED_CLUSTERS so a newly supported cluster is opt-in here instead of going live with the package bump.
// Type-only import keeps the MCP runtime out of any bundle that reads this.
export const MCP_ENABLED_CLUSTERS: readonly [SupportedCluster, ...SupportedCluster[]] = [
    'mainnet-beta',
    'devnet',
    'testnet',
    'simd296',
];
