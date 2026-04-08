import type { PublicKey } from '@solana/web3.js';
import type BN from 'bn.js';

/** Map from mint address (base58) to its decimal precision */
export type MintDecimalsMap = Record<string, number>;

export type SolBalanceChange = {
    delta: BN;
    postBalance: BN;
    preBalance: BN;
    pubkey: PublicKey;
};
