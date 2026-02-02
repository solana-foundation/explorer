import { Keypair } from '@solana/web3.js';

export const SENDER = Keypair.generate();
export const RECEIVER = Keypair.generate();
export const MINT = Keypair.generate();
export const SOURCE_TOKEN_ACCOUNT = Keypair.generate();
export const DESTINATION_TOKEN_ACCOUNT = Keypair.generate();
export const FEE_PAYER = Keypair.generate();
export const MULTISIG_AUTHORITY = Keypair.generate();
