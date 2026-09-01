import type { SolanaRpc } from '@entities/cluster';
import { address, getOptionDecoder, getU64Decoder, isSome } from '@solana/kit';

import { fromBase64 } from '@/app/shared/lib/bytes';

/** The feature gate that activates transaction v1 on a cluster. */
export const ENABLE_TX_V1_FEATURE = address('txv1aq4pp281K9um3tnPgkfX8UqtFT6wcVW3hNezGLL');

/**
 * A feature account holds a bincode-serialized `solana_feature_gate_interface::Feature`,
 * which is a single `Option<u64>`: a one-byte tag followed by the activation slot.
 */
const featureAccountDecoder = getOptionDecoder(getU64Decoder());

/**
 * Reports whether transaction v1 is live on the cluster behind `rpc`.
 *
 * The feature account exists only once the gate has been staged, and its activation slot is
 * filled in only once the gate goes live. Both an absent account and a staged-but-inactive one
 * mean the cluster rejects v1 transactions, so both answer `false`. Local validators activate
 * every feature at genesis, so this is `true` from slot 0 there.
 */
export async function isTxV1Active(rpc: SolanaRpc): Promise<boolean> {
    const { value: account } = await rpc
        .getAccountInfo(ENABLE_TX_V1_FEATURE, { commitment: 'confirmed', encoding: 'base64' })
        .send();
    return account !== null && isSome(featureAccountDecoder.decode(fromBase64(account.data[0])));
}
