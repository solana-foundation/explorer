import type { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export type SolBalanceChange = {
    delta: BN;
    postBalance: BN;
    preBalance: BN;
    pubkey: PublicKey;
};
