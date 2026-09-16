import { Cluster } from '@utils/cluster';
import { INNER_INSTRUCTIONS_START_SLOT } from '@utils/index';

/**
 * The inner instructions a surface may render, or `undefined` when the source cannot be trusted
 * for them.
 *
 * Mainnet did not record inner instructions before `INNER_INSTRUCTIONS_START_SLOT`, so a
 * transaction from an earlier slot reports nothing rather than reporting an empty list as fact.
 */
export function trustedInnerInstructions<T>(
    innerInstructions: T[] | null | undefined,
    { cluster, slot }: { cluster: Cluster; slot: number },
): T[] | undefined {
    if (!innerInstructions) return undefined;
    if (cluster === Cluster.MainnetBeta && slot < INNER_INSTRUCTIONS_START_SLOT) return undefined;
    return innerInstructions;
}
