/* eslint-disable @typescript-eslint/no-redeclare */

import { PublicKeyFromString } from '@validators/pubkey';
import { array, boolean, enums, Infer, nullable, number, optional, string, type, union } from 'superstruct';

export type TokenAmountUi = Infer<typeof TokenAmountUi>;
export const TokenAmountUi = type({
    amount: string(),
    decimals: number(),
    uiAmountString: string(),
});

const InitializeMint = type({
    decimals: number(),
    freezeAuthority: optional(PublicKeyFromString),
    mint: PublicKeyFromString,
    mintAuthority: PublicKeyFromString,
    rentSysvar: PublicKeyFromString,
});

const InitializeMint2 = type({
    decimals: number(),
    freezeAuthority: PublicKeyFromString,
    freezeAuthorityOption: optional(number()),
    mint: PublicKeyFromString,
    mintAuthority: PublicKeyFromString,
});

const InitializeAccount = type({
    account: PublicKeyFromString,
    mint: PublicKeyFromString,
    owner: PublicKeyFromString,
    rentSysvar: PublicKeyFromString,
});

const InitializeAccount2 = type({
    account: PublicKeyFromString,
    mint: PublicKeyFromString,
    owner: PublicKeyFromString,
    rentSysvar: PublicKeyFromString,
});

const InitializeAccount3 = type({
    account: PublicKeyFromString,
    mint: PublicKeyFromString,
    owner: PublicKeyFromString,
});

const InitializeMultisig = type({
    m: number(),
    multisig: PublicKeyFromString,
    rentSysvar: PublicKeyFromString,
    signers: array(PublicKeyFromString),
});

export type Transfer = Infer<typeof Transfer>;
export const Transfer = type({
    amount: union([string(), number()]),
    authority: optional(PublicKeyFromString),
    destination: PublicKeyFromString,
    multisigAuthority: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
    source: PublicKeyFromString,
});

const Approve = type({
    amount: union([string(), number()]),
    delegate: PublicKeyFromString,
    multisigOwner: optional(PublicKeyFromString),
    owner: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
    source: PublicKeyFromString,
});

const Revoke = type({
    multisigOwner: optional(PublicKeyFromString),
    owner: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
    source: PublicKeyFromString,
});

const AuthorityType = enums(['mintTokens', 'freezeAccount', 'accountOwner', 'closeAccount']);

const SetAuthority = type({
    account: optional(PublicKeyFromString),
    authority: optional(PublicKeyFromString),
    authorityType: AuthorityType,
    mint: optional(PublicKeyFromString),
    multisigAuthority: optional(PublicKeyFromString),
    newAuthority: nullable(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
});

const MintTo = type({
    account: PublicKeyFromString,
    amount: union([string(), number()]),
    mint: PublicKeyFromString,
    mintAuthority: optional(PublicKeyFromString),
    multisigMintAuthority: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
});

const Burn = type({
    account: PublicKeyFromString,
    amount: union([string(), number()]),
    authority: optional(PublicKeyFromString),
    mint: PublicKeyFromString,
    multisigAuthority: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
});

const CloseAccount = type({
    account: PublicKeyFromString,
    destination: PublicKeyFromString,
    multisigOwner: optional(PublicKeyFromString),
    owner: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
});

const FreezeAccount = type({
    account: PublicKeyFromString,
    freezeAuthority: optional(PublicKeyFromString),
    mint: PublicKeyFromString,
    multisigFreezeAuthority: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
});

const ThawAccount = type({
    account: PublicKeyFromString,
    freezeAuthority: optional(PublicKeyFromString),
    mint: PublicKeyFromString,
    multisigFreezeAuthority: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
});

export type TransferChecked = Infer<typeof TransferChecked>;
export const TransferChecked = type({
    authority: optional(PublicKeyFromString),
    destination: PublicKeyFromString,
    mint: PublicKeyFromString,
    multisigAuthority: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
    source: PublicKeyFromString,
    tokenAmount: TokenAmountUi,
});

const ApproveChecked = type({
    delegate: PublicKeyFromString,
    mint: PublicKeyFromString,
    multisigOwner: optional(PublicKeyFromString),
    owner: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
    source: PublicKeyFromString,
    tokenAmount: TokenAmountUi,
});

const MintToChecked = type({
    account: PublicKeyFromString,
    mint: PublicKeyFromString,
    mintAuthority: optional(PublicKeyFromString),
    multisigMintAuthority: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
    tokenAmount: TokenAmountUi,
});

const BurnChecked = type({
    account: PublicKeyFromString,
    authority: optional(PublicKeyFromString),
    mint: PublicKeyFromString,
    multisigAuthority: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
    tokenAmount: TokenAmountUi,
});

const SyncNative = type({
    account: PublicKeyFromString,
});

const GetAccountDataSize = type({
    extensionTypes: optional(array(string())),
    mint: PublicKeyFromString,
});

const InitializeImmutableOwner = type({
    account: PublicKeyFromString,
});

const AmountToUiAmount = type({
    amount: union([string(), number()]),
    mint: PublicKeyFromString,
});

const UiAmountToAmount = type({
    mint: PublicKeyFromString,
    uiAmount: string(),
});

const InitializeMintCloseAuthority = type({
    mint: PublicKeyFromString,
    newAuthority: PublicKeyFromString,
});

const TransferFeeExtension = type({
    maximumFee: number(),
    mint: PublicKeyFromString,
    transferFeeBasisPoints: number(),
    transferFeeConfigAuthority: PublicKeyFromString,
    withdrawWitheldAuthority: PublicKeyFromString,
});

const DefaultAccountStateExtension = type({
    accountState: string(),
    freezeAuthority: optional(PublicKeyFromString),
    mint: PublicKeyFromString,
});

const Reallocate = type({
    account: PublicKeyFromString,
    extensionTypes: array(string()),
    payer: PublicKeyFromString,
    systemProgram: PublicKeyFromString,
});

const MemoTransferExtension = type({
    account: PublicKeyFromString,
    multisigOwner: optional(PublicKeyFromString),
    owner: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
});

const CreateNativeMint = type({
    nativeMint: PublicKeyFromString,
    payer: PublicKeyFromString,
    systemProgram: PublicKeyFromString,
});

export type InitializeMetadataPointerInfo = Infer<typeof InitializeMetadataPointer>;
const InitializeMetadataPointer = type({
    authority: PublicKeyFromString,
    metadataAddress: PublicKeyFromString,
    mint: PublicKeyFromString,
});

export type InitializeGroupMemberPointerInfo = Infer<typeof InitializeGroupMemberPointer>;
const InitializeGroupMemberPointer = type({
    authority: PublicKeyFromString,
    memberAddress: PublicKeyFromString,
    mint: PublicKeyFromString,
});

const InitializeNonTransferableMint = type({
    mint: PublicKeyFromString,
});

const InitializePermanentDelegate = type({
    delegate: PublicKeyFromString,
    mint: PublicKeyFromString,
});

export type InitializeTokenMetadataInfo = Infer<typeof InitializeTokenMetadata>;
const InitializeTokenMetadata = type({
    metadata: PublicKeyFromString,
    mint: PublicKeyFromString,
    mintAuthority: PublicKeyFromString,
    name: string(),
    symbol: string(),
    updateAuthority: PublicKeyFromString,
    uri: string(),
});

export type UpdateTokenMetadataFieldInfo = Infer<typeof UpdateTokenMetadataField>;
const UpdateTokenMetadataField = type({
    field: string(),
    metadata: PublicKeyFromString,
    updateAuthority: PublicKeyFromString,
    value: string(),
});

export type RemoveTokenMetadataKeyInfo = Infer<typeof RemoveTokenMetadataKey>;
const RemoveTokenMetadataKey = type({
    idempotent: optional(boolean()),
    key: string(),
    metadata: PublicKeyFromString,
    updateAuthority: PublicKeyFromString,
});

export type UpdateTokenMetadataUpdateAuthorityInfo = Infer<typeof UpdateTokenMetadataUpdateAuthority>;
const UpdateTokenMetadataUpdateAuthority = type({
    metadata: PublicKeyFromString,
    newUpdateAuthority: PublicKeyFromString,
    updateAuthority: PublicKeyFromString,
});

export type UpdateTokenMetadataAuthorityInfo = Infer<typeof UpdateTokenMetadataAuthority>;
const UpdateTokenMetadataAuthority = type({
    metadata: PublicKeyFromString,
    newAuthority: PublicKeyFromString,
    updateAuthority: PublicKeyFromString,
});

export type EmitTokenMetadataInfo = Infer<typeof EmitTokenMetadata>;
const EmitTokenMetadata = type({
    end: optional(nullable(number())),
    metadata: PublicKeyFromString,
    start: optional(nullable(number())),
});

export type UpdateMetadataPointerInfo = Infer<typeof UpdateMetadataPointer>;
const UpdateMetadataPointer = type({
    authority: PublicKeyFromString,
    metadataAddress: optional(nullable(PublicKeyFromString)),
    mint: PublicKeyFromString,
});

export type InitializeGroupPointerInfo = Infer<typeof InitializeGroupPointer>;
const InitializeGroupPointer = type({
    authority: PublicKeyFromString,
    groupAddress: PublicKeyFromString,
    mint: PublicKeyFromString,
});

export type UpdateGroupPointerInfo = Infer<typeof UpdateGroupPointer>;
const UpdateGroupPointer = type({
    authority: PublicKeyFromString,
    groupAddress: optional(nullable(PublicKeyFromString)),
    mint: PublicKeyFromString,
});

export type UpdateGroupMemberPointerInfo = Infer<typeof UpdateGroupMemberPointer>;
const UpdateGroupMemberPointer = type({
    authority: PublicKeyFromString,
    memberAddress: optional(nullable(PublicKeyFromString)),
    mint: PublicKeyFromString,
});

export type InitializeTokenGroupInfo = Infer<typeof InitializeTokenGroup>;
const InitializeTokenGroup = type({
    group: PublicKeyFromString,
    maxSize: number(),
    mint: PublicKeyFromString,
    mintAuthority: PublicKeyFromString,
    updateAuthority: PublicKeyFromString,
});

export type UpdateTokenGroupMaxSizeInfo = Infer<typeof UpdateTokenGroupMaxSize>;
const UpdateTokenGroupMaxSize = type({
    group: PublicKeyFromString,
    maxSize: number(),
    updateAuthority: PublicKeyFromString,
});

export type UpdateTokenGroupUpdateAuthorityInfo = Infer<typeof UpdateTokenGroupUpdateAuthority>;
const UpdateTokenGroupUpdateAuthority = type({
    group: PublicKeyFromString,
    newUpdateAuthority: PublicKeyFromString,
    updateAuthority: PublicKeyFromString,
});

export type InitializeTokenGroupMemberInfo = Infer<typeof InitializeTokenGroupMember>;
const InitializeTokenGroupMember = type({
    group: PublicKeyFromString,
    groupUpdateAuthority: PublicKeyFromString,
    member: PublicKeyFromString,
    memberMint: PublicKeyFromString,
    memberMintAuthority: PublicKeyFromString,
});

export type TokenInstructionType = Infer<typeof TokenInstructionType>;
export const TokenInstructionType = enums([
    'initializeMint',
    'initializeMint2',
    'initializeAccount',
    'initializeAccount2',
    'initializeAccount3',
    'initializeGroupMemberPointer',
    'initializeMultisig',
    'initializeNonTransferableMint',
    'initializeTokenGroupMember',
    'initializeTokenMetadata',
    'initializePermanentDelegate',
    'initializeMetadataPointer',
    'transfer',
    'approve',
    'revoke',
    'setAuthority',
    'mintTo',
    'burn',
    'closeAccount',
    'freezeAccount',
    'thawAccount',
    'transfer2',
    'approve2',
    'mintTo2',
    'burn2',
    'transferChecked',
    'approveChecked',
    'mintToChecked',
    'burnChecked',
    'syncNative',
    'getAccountDataSize',
    'initializeImmutableOwner',
    'amountToUiAmount',
    'uiAmountToAmount',
    'initializeMintCloseAuthority',
    'transferFeeExtension',
    'defaultAccountStateExtension',
    'reallocate',
    'memoTransferExtension',
    'updateTokenMetadataField',
    'removeTokenMetadataKey',
    'updateTokenMetadataAuthority',
    'updateTokenMetadataUpdateAuthority',
    'emitTokenMetadata',
    'updateMetadataPointer',
    'initializeGroupPointer',
    'updateGroupPointer',
    'updateGroupMemberPointer',
    'initializeTokenGroup',
    'updateTokenGroupMaxSize',
    'updateTokenGroupUpdateAuthority',
    'createNativeMint',
]);

export const IX_STRUCTS = {
    amountToUiAmount: AmountToUiAmount,
    approve: Approve,
    approve2: ApproveChecked,
    approveChecked: ApproveChecked,
    burn: Burn,
    burn2: BurnChecked,
    burnChecked: BurnChecked,
    closeAccount: CloseAccount,
    createNativeMint: CreateNativeMint,
    defaultAccountStateExtension: DefaultAccountStateExtension,
    emitTokenMetadata: EmitTokenMetadata,
    freezeAccount: FreezeAccount,
    getAccountDataSize: GetAccountDataSize,
    initializeAccount: InitializeAccount,
    initializeAccount2: InitializeAccount2,
    initializeAccount3: InitializeAccount3,
    initializeGroupMemberPointer: InitializeGroupMemberPointer,
    initializeGroupPointer: InitializeGroupPointer,
    initializeImmutableOwner: InitializeImmutableOwner,
    initializeMetadataPointer: InitializeMetadataPointer,
    initializeMint: InitializeMint,
    initializeMint2: InitializeMint2,
    initializeMintCloseAuthority: InitializeMintCloseAuthority,
    initializeMultisig: InitializeMultisig,
    initializeNonTransferableMint: InitializeNonTransferableMint,
    initializePermanentDelegate: InitializePermanentDelegate,
    initializeTokenGroup: InitializeTokenGroup,
    initializeTokenGroupMember: InitializeTokenGroupMember,
    initializeTokenMetadata: InitializeTokenMetadata,
    memoTransferExtension: MemoTransferExtension,
    mintTo: MintTo,
    mintTo2: MintToChecked,
    mintToChecked: MintToChecked,
    reallocate: Reallocate,
    removeTokenMetadataKey: RemoveTokenMetadataKey,
    revoke: Revoke,
    setAuthority: SetAuthority,
    syncNative: SyncNative,
    thawAccount: ThawAccount,
    transfer: Transfer,
    transfer2: TransferChecked,
    transferChecked: TransferChecked,
    transferFeeExtension: TransferFeeExtension,
    uiAmountToAmount: UiAmountToAmount,
    updateGroupMemberPointer: UpdateGroupMemberPointer,
    updateGroupPointer: UpdateGroupPointer,
    updateMetadataPointer: UpdateMetadataPointer,
    updateTokenGroupMaxSize: UpdateTokenGroupMaxSize,
    updateTokenGroupUpdateAuthority: UpdateTokenGroupUpdateAuthority,
    updateTokenMetadataAuthority: UpdateTokenMetadataAuthority,
    updateTokenMetadataField: UpdateTokenMetadataField,
    updateTokenMetadataUpdateAuthority: UpdateTokenMetadataUpdateAuthority,
};

export const IX_TITLES = {
    amountToUiAmount: 'Amount To UiAmount',
    approve: 'Approve',
    approve2: 'Approve (Checked)',
    approveChecked: 'Approve (Checked)',
    burn: 'Burn',
    burn2: 'Burn (Checked)',
    burnChecked: 'Burn (Checked)',
    closeAccount: 'Close Account',
    createNativeMint: 'Create Native Mint',
    defaultAccountStateExtension: 'Default Account State Extension',
    emitTokenMetadata: 'Emit Token Metadata',
    freezeAccount: 'Freeze Account',
    getAccountDataSize: 'Get Account Data Size',
    initializeAccount: 'Initialize Account',
    initializeAccount2: 'Initialize Account (2)',
    initializeAccount3: 'Initialize Account (3)',
    initializeGroupMemberPointer: 'Initialize Group Member Pointer',
    initializeGroupPointer: 'Initialize Group Pointer',
    initializeImmutableOwner: 'Initialize Immutable Owner',
    initializeMetadataPointer: 'Initialize Metadata Pointer',
    initializeMint: 'Initialize Mint',
    initializeMint2: 'Initialize Mint (2)',
    initializeMintCloseAuthority: 'Initialize Mint Close Authority',
    initializeMultisig: 'Initialize Multisig',
    initializeNonTransferableMint: 'Initialize Non-Transferable Mint',
    initializePermanentDelegate: 'Initialize Permanent Delegate',
    initializeTokenGroup: 'Initialize Token Group',
    initializeTokenGroupMember: 'Initialize Token Group Member',
    initializeTokenMetadata: 'Initialize Token Metadata',
    memoTransferExtension: 'Memo Transfer Extension',
    mintTo: 'Mint To',
    mintTo2: 'Mint To (Checked)',
    mintToChecked: 'Mint To (Checked)',
    reallocate: 'Reallocate',
    removeTokenMetadataKey: 'Remove Token Metadata Key',
    revoke: 'Revoke',
    setAuthority: 'Set Authority',
    syncNative: 'Sync Native',
    thawAccount: 'Thaw Account',
    transfer: 'Transfer',
    transfer2: 'Transfer (Checked)',
    transferChecked: 'Transfer (Checked)',
    transferFeeExtension: 'Transfer Fee Extension',
    uiAmountToAmount: 'UiAmount To Amount',
    updateGroupMemberPointer: 'Update Group Member Pointer',
    updateGroupPointer: 'Update Group Pointer',
    updateMetadataPointer: 'Update Metadata Pointer',
    updateTokenGroupMaxSize: 'Update Token Group Max Size',
    updateTokenGroupUpdateAuthority: 'Update Token Group Update Authority',
    updateTokenMetadataAuthority: 'Update Token Metadata Authority',
    updateTokenMetadataField: 'Update Token Metadata Field',
    updateTokenMetadataUpdateAuthority: 'Update Token Metadata Update Authority',
};
