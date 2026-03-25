// `TokenInstruction::Batch` (discriminator 255) — executes a sequence of sub-instructions
// packed into a single instruction's data. Each sub-instruction is encoded as:
//   u8 num_accounts | u8 data_len | u8 discriminator | [u8] data
// https://github.com/solana-program/token/blob/065786e/pinocchio/interface/src/instruction.rs#L552
export const BATCH_DISCRIMINATOR = 0xff;

// Maps SPL Token sub-instruction discriminators to human-readable names.
// Base instructions (0–24, 38, 45):
// https://github.com/solana-program/token/blob/065786e/pinocchio/interface/src/instruction.rs#L9-L551
// Token-2022 extension instructions (25–44):
// https://github.com/solana-program/token-2022/blob/main/interface/src/instruction.rs
/* eslint-disable sort-keys-fix/sort-keys-fix */
const DISCRIMINATOR_TO_TYPE_NAME = {
    0: 'InitializeMint',
    1: 'InitializeAccount',
    2: 'InitializeMultisig',
    3: 'Transfer',
    4: 'Approve',
    5: 'Revoke',
    6: 'SetAuthority',
    7: 'MintTo',
    8: 'Burn',
    9: 'CloseAccount',
    10: 'FreezeAccount',
    11: 'ThawAccount',
    12: 'TransferChecked',
    13: 'ApproveChecked',
    14: 'MintToChecked',
    15: 'BurnChecked',
    16: 'InitializeAccount2',
    17: 'SyncNative',
    18: 'InitializeAccount3',
    19: 'InitializeMultisig2',
    20: 'InitializeMint2',
    21: 'GetAccountDataSize',
    22: 'InitializeImmutableOwner',
    23: 'AmountToUiAmount',
    24: 'UiAmountToAmount',
    // Token-2022 extension instructions (discriminators 25–44).
    // Each extension group uses a sub-discriminator in the second data byte
    // to distinguish individual operations within the group.
    25: 'InitializeMintCloseAuthority',
    26: 'TransferFeeExtension',
    27: 'ConfidentialTransferExtension',
    28: 'DefaultAccountStateExtension',
    29: 'Reallocate',
    30: 'MemoTransferExtension',
    31: 'CreateNativeMint',
    32: 'InitializeNonTransferableMint',
    33: 'InterestBearingMintExtension',
    34: 'CpiGuardExtension',
    35: 'InitializePermanentDelegate',
    36: 'TransferHookExtension',
    37: 'ConfidentialTransferFeeExtension',
    38: 'WithdrawExcessLamports',
    39: 'MetadataPointerExtension',
    40: 'GroupPointerExtension',
    41: 'GroupMemberPointerExtension',
    43: 'ScaledUiAmountExtension',
    44: 'PausableExtension',
    45: 'UnwrapLamports',
} as const;
/* eslint-enable sort-keys-fix/sort-keys-fix */

export type TokenInstructionName = (typeof DISCRIMINATOR_TO_TYPE_NAME)[keyof typeof DISCRIMINATOR_TO_TYPE_NAME];

// Intentional type widening (not a typecast) so that arbitrary numeric keys
// return `TokenInstructionName | undefined` instead of requiring a known literal.
export const typeNameByDiscriminator: Record<number, TokenInstructionName | undefined> = DISCRIMINATOR_TO_TYPE_NAME;
