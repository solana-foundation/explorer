import { type Address, createSolanaRpc } from '@solana/kit';
import { STAKE_PROGRAM_ADDRESS } from '@solana-program/stake';

/**
 * Whether `address` is owned by the stake program.
 *
 * A gate in front of the metered Solscan request, not a correctness check. The route is public and
 * every cache miss spends shared paid quota — with paging, one request costs up to ten upstream
 * calls. Confirming the address is a stake account first means an enumeration of arbitrary
 * addresses is answered by one cheap RPC call instead. Legitimate traffic only ever asks about
 * stake accounts, so it costs users nothing.
 *
 * Errors propagate: if we cannot tell, we do not spend the quota. The stake page already needs RPC
 * to render at all, so this adds no failure surface in practice.
 *
 * Server-only.
 */
export async function isStakeAccount({ address, rpcUrl }: { address: Address; rpcUrl: string }): Promise<boolean> {
    const rpc = createSolanaRpc(rpcUrl);
    // Only the owner matters, so skip the 200-byte body.
    const { value } = await rpc
        .getAccountInfo(address, { dataSlice: { length: 0, offset: 0 }, encoding: 'base64' })
        .send();

    return value?.owner === STAKE_PROGRAM_ADDRESS;
}
