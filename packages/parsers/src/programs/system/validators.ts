import { AddressFromString } from '../../address.js';
import { Infer, never, number, optional, string, type, union } from 'superstruct';

export type CreateAccountInfo = Infer<typeof CreateAccountInfo>;
export const CreateAccountInfo = type({
    lamports: number(),
    newAccount: AddressFromString,
    owner: AddressFromString,
    source: AddressFromString,
    space: number(),
});

export type AssignInfo = Infer<typeof AssignInfo>;
export const AssignInfo = type({
    account: AddressFromString,
    owner: AddressFromString,
});

export type TransferInfo = Infer<typeof TransferInfo>;
export const TransferInfo = type({
    destination: AddressFromString,
    lamports: number(),
    source: AddressFromString,
});

export type CreateAccountWithSeedInfo = Infer<typeof CreateAccountWithSeedInfo>;
export const CreateAccountWithSeedInfo = type({
    base: AddressFromString,
    lamports: number(),
    newAccount: AddressFromString,
    owner: AddressFromString,
    seed: string(),
    source: AddressFromString,
    space: number(),
});

// The RPC sends `source` and `lamports` only when the instruction moves lamports.
export type CreateAccountAllowPrefundInfo = Infer<typeof CreateAccountAllowPrefundInfo>;
export const CreateAccountAllowPrefundInfo = union([
    CreateAccountInfo,
    type({
        lamports: optional(never()),
        newAccount: AddressFromString,
        owner: AddressFromString,
        source: optional(never()),
        space: number(),
    }),
]);

export type AdvanceNonceInfo = Infer<typeof AdvanceNonceInfo>;
export const AdvanceNonceInfo = type({
    nonceAccount: AddressFromString,
    nonceAuthority: AddressFromString,
});

export type WithdrawNonceInfo = Infer<typeof WithdrawNonceInfo>;
export const WithdrawNonceInfo = type({
    destination: AddressFromString,
    lamports: number(),
    nonceAccount: AddressFromString,
    nonceAuthority: AddressFromString,
});

export type InitializeNonceInfo = Infer<typeof InitializeNonceInfo>;
export const InitializeNonceInfo = type({
    nonceAccount: AddressFromString,
    nonceAuthority: AddressFromString,
});

export type AuthorizeNonceInfo = Infer<typeof AuthorizeNonceInfo>;
export const AuthorizeNonceInfo = type({
    newAuthorized: AddressFromString,
    nonceAccount: AddressFromString,
    nonceAuthority: AddressFromString,
});

export type AllocateInfo = Infer<typeof AllocateInfo>;
export const AllocateInfo = type({
    account: AddressFromString,
    space: number(),
});

export type AllocateWithSeedInfo = Infer<typeof AllocateWithSeedInfo>;
export const AllocateWithSeedInfo = type({
    account: AddressFromString,
    base: AddressFromString,
    owner: AddressFromString,
    seed: string(),
    space: number(),
});

export type AssignWithSeedInfo = Infer<typeof AssignWithSeedInfo>;
export const AssignWithSeedInfo = type({
    account: AddressFromString,
    base: AddressFromString,
    owner: AddressFromString,
    seed: string(),
});

export type TransferWithSeedInfo = Infer<typeof TransferWithSeedInfo>;
export const TransferWithSeedInfo = type({
    destination: AddressFromString,
    lamports: number(),
    source: AddressFromString,
    sourceBase: AddressFromString,
    sourceOwner: AddressFromString,
    sourceSeed: string(),
});

export type UpgradeNonceInfo = Infer<typeof UpgradeNonceInfo>;
export const UpgradeNonceInfo = type({
    nonceAccount: AddressFromString,
});
