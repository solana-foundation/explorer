import type { AccountInfo, ParsedAccountData, PublicKey, SimulatedTransactionAccountInfo } from '@solana/web3.js';
import BN from 'bn.js';

import type { SolBalanceChange } from './types';

/**
 * Compute per-account SOL balance deltas between pre- and post-simulation state.
 *
 * When `knownBalances` is provided (the transaction was already confirmed and we
 * have on-chain pre/post balances), those take precedence over the simulated data.
 * This lets the UI show accurate SOL changes for confirmed transactions while
 * still supporting simulation-only scenarios.
 */
export function computeSolBalanceChanges(
    accountKeys: PublicKey[],
    parsedAccountsPre: (AccountInfo<ParsedAccountData | Buffer> | undefined)[],
    accountsPost: (SimulatedTransactionAccountInfo | undefined)[],
    knownBalances?: { preBalances: number[]; postBalances: number[] },
): SolBalanceChange[] {
    return accountKeys
        .map((pubkey, i) => {
            // Fallback to 0 is safe: for knownBalances, the RPC getTransaction response
            // guarantees pre/postBalances arrays match accountKeys in length; for simulation
            // data, a missing account genuinely has 0 lamports.
            const [pre, post] = knownBalances
                ? [knownBalances.preBalances[i] ?? 0, knownBalances.postBalances[i] ?? 0]
                : [parsedAccountsPre[i]?.lamports ?? 0, accountsPost.at(i)?.lamports ?? 0];

            const delta = new BN(post).sub(new BN(pre));

            return { delta, postBalance: new BN(post), preBalance: new BN(pre), pubkey };
        })
        .filter(({ delta }) => !delta.isZero());
}
