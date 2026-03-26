import type { PublicKey } from '@solana/web3.js';

export type AccountEntry = { pubkey: PublicKey; isSigner: boolean; isWritable: boolean };

export type LabeledAccount = AccountEntry & { label: string };

export type DecodedParams = {
    fields: { label: string; value: string }[];
    accounts: LabeledAccount[];
};

// ── Raw decoded results (wire data only, no presentation) ────────────

export type RawAmount = {
    type: 'transfer' | 'approve' | 'mintTo' | 'burn';
    amount: bigint;
    accounts: AccountEntry[];
};

export type RawCheckedAmount = {
    type: 'transferChecked' | 'approveChecked' | 'mintToChecked' | 'burnChecked';
    amount: bigint;
    decimals: number;
    accounts: AccountEntry[];
};

export type RawCloseAccount = {
    type: 'closeAccount';
    accounts: AccountEntry[];
};

export type RawSetAuthority = {
    type: 'setAuthority';
    authorityType: number;
    newAuthority: string | undefined;
    accounts: AccountEntry[];
};

export type RawDecoded = RawAmount | RawCheckedAmount | RawCloseAccount | RawSetAuthority;
