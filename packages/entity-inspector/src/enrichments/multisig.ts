import type { SupportedCluster } from '../config.js';
import type { InspectorLogger } from '../logger.js';
import type { RpcClient } from '../rpc/rpc.js';
import type { MultisigReferenceResult } from './types.js';
import { resolveSplMultisigReference } from './spl-multisig.js';
import { resolveSquadsMultisigReference } from './squads-multisig.js';

export type ResolveMultisigReference = (
    upgradeAuthority: string | null,
    cluster: SupportedCluster,
) => Promise<MultisigReferenceResult>;

export type MultisigResolverDependencies = {
    fetchAccountInfo: RpcClient['fetchAccountInfo'];
    logger: InspectorLogger;
};

/** Squads first, SPL token multisig as the fallback. */
export function createMultisigResolver(dependencies: MultisigResolverDependencies): ResolveMultisigReference {
    return async (upgradeAuthority, cluster) => {
        const squadsResult = await resolveSquadsMultisigReference(upgradeAuthority, cluster, dependencies);

        if (squadsResult.status === 'is_multisig' || upgradeAuthority === null) {
            return squadsResult;
        }

        // On mainnet, Squads "unknown" means a transient failure — don't fall through
        // to SPL since they detect different multisig types.
        if (squadsResult.status === 'unknown' && cluster === 'mainnet-beta') {
            return squadsResult;
        }

        return resolveSplMultisigReference(upgradeAuthority, cluster, dependencies);
    };
}
