import { Cluster } from '@utils/cluster';
import { INNER_INSTRUCTIONS_START_SLOT } from '@utils/index';

/**
 * Mainnet did not record inner instructions before `INNER_INSTRUCTIONS_START_SLOT`.
 * A transaction from an earlier slot returns `undefined`, not an empty list.
 */
export function trustedInnerInstructions<T>(
    innerInstructions: T[] | null | undefined,
    { cluster, slot }: { cluster: Cluster; slot: number },
): T[] | undefined {
    if (!innerInstructions) return undefined;
    if (cluster !== Cluster.MainnetBeta) return innerInstructions;
    // A missing slot is `NaN`, and comparisons with `NaN` are always false.
    if (!Number.isFinite(slot) || slot < INNER_INSTRUCTIONS_START_SLOT) return undefined;
    return innerInstructions;
}
