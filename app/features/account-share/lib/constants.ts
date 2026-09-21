import { Cluster, type ServerCluster } from '@utils/cluster';

/** The wall-clock budget for all RPC + provenance work behind one account card. */
export const RPC_BUDGET_MS = 2_500;

/**
 * The one page `getSignaturesForAddress` returns, and the cap the activity count reads as. A single
 * 1000-signature call is one round trip; counting past it would page, which an image route cannot afford,
 * so `1,000` prints as `1,000+`.
 */
export const SIGNATURE_LOOKUP_LIMIT = 1_000;

/** Programs deployed by this loader keep their bytes, authority, and deploy slot in a separate data account. */
export const BPF_UPGRADEABLE_LOADER_ADDRESS = 'BPFLoaderUpgradeab1e11111111111111111111111';

/** The upgradeable program-data account prefixes its bytes with this many, so the program size subtracts it. */
export const PROGRAM_DATA_HEADER_SIZE = 45;

/**
 * OSEC hosts one verified-builds registry per cluster; testnet and custom have none.
 * Kept local to this feature so the server route never imports the client `verified-builds` module (SWR/React).
 */
const OSEC_REGISTRY_URL_BY_CLUSTER: Partial<Record<ServerCluster, string>> = {
    [Cluster.MainnetBeta]: 'https://verify.osec.io',
    [Cluster.Devnet]: 'https://verify-devnet.osec.io',
};

export function getOsecRegistryUrl(cluster: ServerCluster): string | undefined {
    return OSEC_REGISTRY_URL_BY_CLUSTER[cluster];
}
