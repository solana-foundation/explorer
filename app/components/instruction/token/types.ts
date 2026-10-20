import { PublicKeyFromString } from '@validators/pubkey';
import { array, boolean, create, enums, Infer, nullable, number, optional, string, type, union } from 'superstruct';

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
    freezeAuthority: optional(PublicKeyFromString),
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

// Confidential Transfer extension instructions (Token-2022).
// JSON shapes mirror agave/transaction-status/src/parse_token/extension/confidential_transfer.rs.

const InitializeConfidentialTransferMint = type({
    auditorElGamalPubkey: nullable(string()),
    authority: optional(PublicKeyFromString),
    autoApproveNewAccounts: boolean(),
    mint: PublicKeyFromString,
});

const UpdateConfidentialTransferMint = type({
    auditorElGamalPubkey: nullable(string()),
    autoApproveNewAccounts: boolean(),
    confidentialTransferMintAuthority: PublicKeyFromString,
    mint: PublicKeyFromString,
});

const ConfigureConfidentialTransferAccount = type({
    account: PublicKeyFromString,
    decryptableZeroBalance: string(),
    instructionsSysvar: optional(PublicKeyFromString),
    maximumPendingBalanceCreditCounter: union([string(), number()]),
    mint: PublicKeyFromString,
    multisigOwner: optional(PublicKeyFromString),
    owner: optional(PublicKeyFromString),
    proofContextStateAccount: optional(PublicKeyFromString),
    proofInstructionOffset: number(),
    recordAccount: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
});

const ApproveConfidentialTransferAccount = type({
    account: PublicKeyFromString,
    confidentialTransferAuditorAuthority: PublicKeyFromString,
    mint: PublicKeyFromString,
});

const EmptyConfidentialTransferAccount = type({
    account: PublicKeyFromString,
    instructionsSysvar: optional(PublicKeyFromString),
    multisigOwner: optional(PublicKeyFromString),
    owner: optional(PublicKeyFromString),
    proofContextStateAccount: optional(PublicKeyFromString),
    proofInstructionOffset: number(),
    recordAccount: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
});

const DepositConfidentialTransfer = type({
    amount: union([string(), number()]),
    decimals: number(),
    destination: PublicKeyFromString,
    mint: PublicKeyFromString,
    multisigOwner: optional(PublicKeyFromString),
    owner: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
    source: PublicKeyFromString,
});

const WithdrawConfidentialTransfer = type({
    amount: union([string(), number()]),
    decimals: number(),
    destination: PublicKeyFromString,
    equalityProofContextStateAccount: optional(PublicKeyFromString),
    equalityProofInstructionOffset: number(),
    equalityProofRecordAccount: optional(PublicKeyFromString),
    instructionsSysvar: optional(PublicKeyFromString),
    mint: PublicKeyFromString,
    multisigOwner: optional(PublicKeyFromString),
    newDecryptableAvailableBalance: string(),
    owner: optional(PublicKeyFromString),
    rangeProofContextStateAccount: optional(PublicKeyFromString),
    rangeProofInstructionOffset: number(),
    rangeProofRecordAccount: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
    source: PublicKeyFromString,
});

const ConfidentialTransfer = type({
    ciphertextValidityProofContextStateAccount: optional(PublicKeyFromString),
    ciphertextValidityProofInstructionOffset: number(),
    ciphertextValidityProofRecordAccount: optional(PublicKeyFromString),
    destination: PublicKeyFromString,
    equalityProofContextStateAccount: optional(PublicKeyFromString),
    equalityProofInstructionOffset: number(),
    equalityProofRecordAccount: optional(PublicKeyFromString),
    instructionsSysvar: optional(PublicKeyFromString),
    mint: PublicKeyFromString,
    multisigOwner: optional(PublicKeyFromString),
    newSourceDecryptableAvailableBalance: string(),
    owner: optional(PublicKeyFromString),
    rangeProofContextStateAccount: optional(PublicKeyFromString),
    rangeProofInstructionOffset: number(),
    rangeProofRecordAccount: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
    source: PublicKeyFromString,
});

const ConfidentialTransferWithFee = type({
    destination: PublicKeyFromString,
    equalityProofContextStateAccount: optional(PublicKeyFromString),
    equalityProofInstructionOffset: number(),
    equalityProofRecordAccount: optional(PublicKeyFromString),
    feeCiphertextValidityProofContextStateAccount: optional(PublicKeyFromString),
    feeCiphertextValidityProofInstructionOffset: number(),
    feeCiphertextValidityProofRecordAccount: optional(PublicKeyFromString),
    feeSigmaProofContextStateAccount: optional(PublicKeyFromString),
    feeSigmaProofInstructionOffset: number(),
    feeSigmaProofRecordAccount: optional(PublicKeyFromString),
    instructionsSysvar: optional(PublicKeyFromString),
    mint: PublicKeyFromString,
    multisigOwner: optional(PublicKeyFromString),
    newSourceDecryptableAvailableBalance: string(),
    owner: optional(PublicKeyFromString),
    rangeProofContextStateAccount: optional(PublicKeyFromString),
    rangeProofInstructionOffset: number(),
    rangeProofRecordAccount: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
    source: PublicKeyFromString,
    transferAmountCiphertextValidityProofContextStateAccount: optional(PublicKeyFromString),
    transferAmountCiphertextValidityProofInstructionOffset: number(),
    transferAmountCiphertextValidityProofRecordAccount: optional(PublicKeyFromString),
});

const ApplyPendingConfidentialTransferBalance = type({
    account: PublicKeyFromString,
    expectedPendingBalanceCreditCounter: union([string(), number()]),
    multisigOwner: optional(PublicKeyFromString),
    newDecryptableAvailableBalance: string(),
    owner: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
});

const ConfidentialTransferCreditsToggle = type({
    account: PublicKeyFromString,
    multisigOwner: optional(PublicKeyFromString),
    owner: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
});

const ConfigureConfidentialAccountWithRegistry = type({
    account: PublicKeyFromString,
    mint: PublicKeyFromString,
    registry: PublicKeyFromString,
});

const WithdrawExcessLamports = type({
    authority: optional(PublicKeyFromString),
    destination: PublicKeyFromString,
    multisigAuthority: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
    source: PublicKeyFromString,
});

// Token-2022 extension instructions the RPC pre-parses under their own `type` names (agave
// `parse_token/extension`). Authority-gated ones carry either a single or a multisig authority.
const MintAuthorityGated = {
    authority: optional(PublicKeyFromString),
    mint: PublicKeyFromString,
    multisigAuthority: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
};

const InitializePausableConfig = type({
    authority: optional(nullable(PublicKeyFromString)),
    mint: PublicKeyFromString,
});

const PausableToggle = type(MintAuthorityGated);

const InitializeDefaultAccountState = type({
    accountState: string(),
    mint: PublicKeyFromString,
});

const UpdateDefaultAccountState = type({
    accountState: string(),
    freezeAuthority: optional(PublicKeyFromString),
    mint: PublicKeyFromString,
    multisigFreezeAuthority: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
});

const CpiGuardToggle = type({
    account: PublicKeyFromString,
    multisigOwner: optional(PublicKeyFromString),
    owner: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
});

const InitializeInterestBearingConfig = type({
    mint: PublicKeyFromString,
    rate: number(),
    rateAuthority: optional(nullable(PublicKeyFromString)),
});

const UpdateInterestRate = type({
    mint: PublicKeyFromString,
    multisigRateAuthority: optional(PublicKeyFromString),
    newRate: number(),
    rateAuthority: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
});

const InitializeTransferHook = type({
    authority: optional(nullable(PublicKeyFromString)),
    mint: PublicKeyFromString,
    programId: optional(nullable(PublicKeyFromString)),
});

const UpdateTransferHook = type({
    authority: optional(PublicKeyFromString),
    mint: PublicKeyFromString,
    multisigAuthority: optional(PublicKeyFromString),
    programId: optional(nullable(PublicKeyFromString)),
    signers: optional(array(PublicKeyFromString)),
});

const InitializeTransferFeeConfig = type({
    maximumFee: number(),
    mint: PublicKeyFromString,
    transferFeeBasisPoints: number(),
    transferFeeConfigAuthority: optional(nullable(PublicKeyFromString)),
    withdrawWithheldAuthority: optional(nullable(PublicKeyFromString)),
});

const SetTransferFee = type({
    maximumFee: optional(number()),
    mint: PublicKeyFromString,
    // Spelled with a lowercase 't' by the RPC parser itself (agave `parse_token/extension/transfer_fee.rs`).
    multisigtransferFeeConfigAuthority: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
    transferFeeBasisPoints: optional(number()),
    transferFeeConfigAuthority: optional(PublicKeyFromString),
});

const HarvestWithheldTokensToMint = type({
    mint: PublicKeyFromString,
    sourceAccounts: array(PublicKeyFromString),
});

const WithdrawWithheldTokens = type({
    feeRecipient: PublicKeyFromString,
    mint: PublicKeyFromString,
    multisigWithdrawWithheldAuthority: optional(PublicKeyFromString),
    signers: optional(array(PublicKeyFromString)),
    sourceAccounts: optional(array(PublicKeyFromString)),
    withdrawWithheldAuthority: optional(PublicKeyFromString),
});

const InitializeScaledUiAmountConfig = type({
    authority: optional(nullable(PublicKeyFromString)),
    mint: PublicKeyFromString,
    multiplier: union([string(), number()]),
});

const UpdateMultiplier = type({
    authority: optional(PublicKeyFromString),
    mint: PublicKeyFromString,
    multisigAuthority: optional(PublicKeyFromString),
    newMultiplier: union([string(), number()]),
    newMultiplierTimestamp: optional(number()),
    signers: optional(array(PublicKeyFromString)),
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
    'initializeConfidentialTransferMint',
    'updateConfidentialTransferMint',
    'configureConfidentialTransferAccount',
    'approveConfidentialTransferAccount',
    'emptyConfidentialTransferAccount',
    'depositConfidentialTransfer',
    'withdrawConfidentialTransfer',
    'confidentialTransfer',
    'confidentialTransferWithFee',
    'applyPendingConfidentialTransferBalance',
    'enableConfidentialTransferConfidentialCredits',
    'disableConfidentialTransferConfidentialCredits',
    'enableConfidentialTransferNonConfidentialCredits',
    'disableConfidentialTransferNonConfidentialCredits',
    'configureConfidentialAccountWithRegistry',
    'withdrawExcessLamports',
    'disableCpiGuard',
    'disableRequiredMemoTransfers',
    'enableCpiGuard',
    'enableRequiredMemoTransfers',
    'harvestWithheldTokensToMint',
    'initializeDefaultAccountState',
    'initializeInterestBearingConfig',
    'initializePausableConfig',
    'initializeScaledUiAmountConfig',
    'initializeTransferFeeConfig',
    'initializeTransferHook',
    'pause',
    'resume',
    'setTransferFee',
    'updateDefaultAccountState',
    'updateInterestBearingConfigRate',
    'updateMultiplier',
    'updateTransferHook',
    'withdrawWithheldTokensFromAccounts',
    'withdrawWithheldTokensFromMint',
]);

export const IX_STRUCTS = {
    amountToUiAmount: AmountToUiAmount,
    applyPendingConfidentialTransferBalance: ApplyPendingConfidentialTransferBalance,
    approve: Approve,
    approve2: ApproveChecked,
    approveChecked: ApproveChecked,
    approveConfidentialTransferAccount: ApproveConfidentialTransferAccount,
    burn: Burn,
    burn2: BurnChecked,
    burnChecked: BurnChecked,
    closeAccount: CloseAccount,
    confidentialTransfer: ConfidentialTransfer,
    confidentialTransferWithFee: ConfidentialTransferWithFee,
    configureConfidentialAccountWithRegistry: ConfigureConfidentialAccountWithRegistry,
    configureConfidentialTransferAccount: ConfigureConfidentialTransferAccount,
    createNativeMint: CreateNativeMint,
    defaultAccountStateExtension: DefaultAccountStateExtension,
    depositConfidentialTransfer: DepositConfidentialTransfer,
    disableConfidentialTransferConfidentialCredits: ConfidentialTransferCreditsToggle,
    disableConfidentialTransferNonConfidentialCredits: ConfidentialTransferCreditsToggle,
    disableCpiGuard: CpiGuardToggle,
    disableRequiredMemoTransfers: MemoTransferExtension,
    emitTokenMetadata: EmitTokenMetadata,
    emptyConfidentialTransferAccount: EmptyConfidentialTransferAccount,
    enableConfidentialTransferConfidentialCredits: ConfidentialTransferCreditsToggle,
    enableConfidentialTransferNonConfidentialCredits: ConfidentialTransferCreditsToggle,
    enableCpiGuard: CpiGuardToggle,
    enableRequiredMemoTransfers: MemoTransferExtension,
    freezeAccount: FreezeAccount,
    getAccountDataSize: GetAccountDataSize,
    harvestWithheldTokensToMint: HarvestWithheldTokensToMint,
    initializeAccount: InitializeAccount,
    initializeAccount2: InitializeAccount2,
    initializeAccount3: InitializeAccount3,
    initializeConfidentialTransferMint: InitializeConfidentialTransferMint,
    initializeDefaultAccountState: InitializeDefaultAccountState,
    initializeGroupMemberPointer: InitializeGroupMemberPointer,
    initializeGroupPointer: InitializeGroupPointer,
    initializeImmutableOwner: InitializeImmutableOwner,
    initializeInterestBearingConfig: InitializeInterestBearingConfig,
    initializeMetadataPointer: InitializeMetadataPointer,
    initializeMint: InitializeMint,
    initializeMint2: InitializeMint2,
    initializeMintCloseAuthority: InitializeMintCloseAuthority,
    initializeMultisig: InitializeMultisig,
    initializeNonTransferableMint: InitializeNonTransferableMint,
    initializePausableConfig: InitializePausableConfig,
    initializePermanentDelegate: InitializePermanentDelegate,
    initializeScaledUiAmountConfig: InitializeScaledUiAmountConfig,
    initializeTokenGroup: InitializeTokenGroup,
    initializeTokenGroupMember: InitializeTokenGroupMember,
    initializeTokenMetadata: InitializeTokenMetadata,
    initializeTransferFeeConfig: InitializeTransferFeeConfig,
    initializeTransferHook: InitializeTransferHook,
    memoTransferExtension: MemoTransferExtension,
    mintTo: MintTo,
    mintTo2: MintToChecked,
    mintToChecked: MintToChecked,
    pause: PausableToggle,
    reallocate: Reallocate,
    removeTokenMetadataKey: RemoveTokenMetadataKey,
    resume: PausableToggle,
    revoke: Revoke,
    setAuthority: SetAuthority,
    setTransferFee: SetTransferFee,
    syncNative: SyncNative,
    thawAccount: ThawAccount,
    transfer: Transfer,
    transfer2: TransferChecked,
    transferChecked: TransferChecked,
    transferFeeExtension: TransferFeeExtension,
    uiAmountToAmount: UiAmountToAmount,
    updateConfidentialTransferMint: UpdateConfidentialTransferMint,
    updateDefaultAccountState: UpdateDefaultAccountState,
    updateGroupMemberPointer: UpdateGroupMemberPointer,
    updateGroupPointer: UpdateGroupPointer,
    updateInterestBearingConfigRate: UpdateInterestRate,
    updateMetadataPointer: UpdateMetadataPointer,
    updateMultiplier: UpdateMultiplier,
    updateTokenGroupMaxSize: UpdateTokenGroupMaxSize,
    updateTokenGroupUpdateAuthority: UpdateTokenGroupUpdateAuthority,
    updateTokenMetadataAuthority: UpdateTokenMetadataAuthority,
    updateTokenMetadataField: UpdateTokenMetadataField,
    updateTokenMetadataUpdateAuthority: UpdateTokenMetadataUpdateAuthority,
    updateTransferHook: UpdateTransferHook,
    withdrawConfidentialTransfer: WithdrawConfidentialTransfer,
    withdrawExcessLamports: WithdrawExcessLamports,
    withdrawWithheldTokensFromAccounts: WithdrawWithheldTokens,
    withdrawWithheldTokensFromMint: WithdrawWithheldTokens,
};

export function getTokenIxValidator(type: string): Parameters<typeof create>[1] | undefined {
    // `type` arrives as a free string from RPC; IX_STRUCTS is keyed by the narrower TokenInstructionType.
    return (IX_STRUCTS as Record<string, Parameters<typeof create>[1]>)[type];
}

export const IX_TITLES = {
    amountToUiAmount: 'Amount To UiAmount',
    applyPendingConfidentialTransferBalance: 'Apply Pending Confidential Transfer Balance',
    approve: 'Approve',
    approve2: 'Approve (Checked)',
    approveChecked: 'Approve (Checked)',
    approveConfidentialTransferAccount: 'Approve Confidential Transfer Account',
    burn: 'Burn',
    burn2: 'Burn (Checked)',
    burnChecked: 'Burn (Checked)',
    closeAccount: 'Close Account',
    confidentialTransfer: 'Confidential Transfer',
    confidentialTransferWithFee: 'Confidential Transfer With Fee',
    configureConfidentialAccountWithRegistry: 'Configure Confidential Account With Registry',
    configureConfidentialTransferAccount: 'Configure Confidential Transfer Account',
    createNativeMint: 'Create Native Mint',
    defaultAccountStateExtension: 'Default Account State Extension',
    depositConfidentialTransfer: 'Deposit Confidential Transfer',
    disableConfidentialTransferConfidentialCredits: 'Disable Confidential Credits',
    disableConfidentialTransferNonConfidentialCredits: 'Disable Non-Confidential Credits',
    disableCpiGuard: 'Disable CPI Guard',
    disableRequiredMemoTransfers: 'Disable Required Memo Transfers',
    emitTokenMetadata: 'Emit Token Metadata',
    emptyConfidentialTransferAccount: 'Empty Confidential Transfer Account',
    enableConfidentialTransferConfidentialCredits: 'Enable Confidential Credits',
    enableConfidentialTransferNonConfidentialCredits: 'Enable Non-Confidential Credits',
    enableCpiGuard: 'Enable CPI Guard',
    enableRequiredMemoTransfers: 'Enable Required Memo Transfers',
    freezeAccount: 'Freeze Account',
    getAccountDataSize: 'Get Account Data Size',
    harvestWithheldTokensToMint: 'Harvest Withheld Tokens To Mint',
    initializeAccount: 'Initialize Account',
    initializeAccount2: 'Initialize Account (2)',
    initializeAccount3: 'Initialize Account (3)',
    initializeConfidentialTransferMint: 'Initialize Confidential Transfer Mint',
    initializeDefaultAccountState: 'Initialize Default Account State',
    initializeGroupMemberPointer: 'Initialize Group Member Pointer',
    initializeGroupPointer: 'Initialize Group Pointer',
    initializeImmutableOwner: 'Initialize Immutable Owner',
    initializeInterestBearingConfig: 'Initialize Interest Bearing Config',
    initializeMetadataPointer: 'Initialize Metadata Pointer',
    initializeMint: 'Initialize Mint',
    initializeMint2: 'Initialize Mint (2)',
    initializeMintCloseAuthority: 'Initialize Mint Close Authority',
    initializeMultisig: 'Initialize Multisig',
    initializeNonTransferableMint: 'Initialize Non-Transferable Mint',
    initializePausableConfig: 'Initialize Pausable Config',
    initializePermanentDelegate: 'Initialize Permanent Delegate',
    initializeScaledUiAmountConfig: 'Initialize Scaled UI Amount Config',
    initializeTokenGroup: 'Initialize Token Group',
    initializeTokenGroupMember: 'Initialize Token Group Member',
    initializeTokenMetadata: 'Initialize Token Metadata',
    initializeTransferFeeConfig: 'Initialize Transfer Fee Config',
    initializeTransferHook: 'Initialize Transfer Hook',
    memoTransferExtension: 'Memo Transfer Extension',
    mintTo: 'Mint To',
    mintTo2: 'Mint To (Checked)',
    mintToChecked: 'Mint To (Checked)',
    pause: 'Pause',
    reallocate: 'Reallocate',
    removeTokenMetadataKey: 'Remove Token Metadata Key',
    resume: 'Resume',
    revoke: 'Revoke',
    setAuthority: 'Set Authority',
    setTransferFee: 'Set Transfer Fee',
    syncNative: 'Sync Native',
    thawAccount: 'Thaw Account',
    transfer: 'Transfer',
    transfer2: 'Transfer (Checked)',
    transferChecked: 'Transfer (Checked)',
    transferFeeExtension: 'Transfer Fee Extension',
    uiAmountToAmount: 'UiAmount To Amount',
    updateConfidentialTransferMint: 'Update Confidential Transfer Mint',
    updateDefaultAccountState: 'Update Default Account State',
    updateGroupMemberPointer: 'Update Group Member Pointer',
    updateGroupPointer: 'Update Group Pointer',
    updateInterestBearingConfigRate: 'Update Interest Bearing Config Rate',
    updateMetadataPointer: 'Update Metadata Pointer',
    updateMultiplier: 'Update Multiplier',
    updateTokenGroupMaxSize: 'Update Token Group Max Size',
    updateTokenGroupUpdateAuthority: 'Update Token Group Update Authority',
    updateTokenMetadataAuthority: 'Update Token Metadata Authority',
    updateTokenMetadataField: 'Update Token Metadata Field',
    updateTokenMetadataUpdateAuthority: 'Update Token Metadata Update Authority',
    updateTransferHook: 'Update Transfer Hook',
    withdrawConfidentialTransfer: 'Withdraw Confidential Transfer',
    withdrawExcessLamports: 'Withdraw Excess Lamports',
    withdrawWithheldTokensFromAccounts: 'Withdraw Withheld Tokens From Accounts',
    withdrawWithheldTokensFromMint: 'Withdraw Withheld Tokens From Mint',
};
