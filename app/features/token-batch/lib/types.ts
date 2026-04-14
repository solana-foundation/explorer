import type { PublicKey } from '@solana/web3.js';

export type AccountEntry = { pubkey: PublicKey; isSigner: boolean; isWritable: boolean };

export type LabeledAccount = AccountEntry & { label: string };

export type DecodedField = { label: string; value: string; isAddress?: boolean };

export type DecodedParams = {
    fields: DecodedField[];
    accounts: LabeledAccount[];
};

// Resolved mint info returned from the RPC fetch pipeline.
// For unchecked Transfer/Approve the mint is discovered via a 2-hop lookup;
// for MintTo/Burn it comes directly from the accounts.
export type MintInfo = { decimals: number; mint?: string };
