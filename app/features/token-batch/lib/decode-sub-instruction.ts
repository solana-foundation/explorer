// Manual decoder for SPL Token sub-instructions embedded in a batched token instruction.
//
// Why not use @solana/spl-token or @solana-program/token?
// Neither package (as of spl-token 0.4.14 / @solana-program/token 0.9.0) includes
// a batch sub-instruction decoder. Their `decodeInstruction` expects a full
// `TransactionInstruction` object — we only have the raw bytes and account list
// extracted from the batch payload, so a mapping layer would still be needed.
//
// Discriminators and data layouts follow the SPL Token instruction enum defined in:
//   https://github.com/solana-program/token/blob/main/interface/src/instruction.rs#L22
//
// Only the most common sub-instructions are decoded here. Others (e.g. InitializeMint,
// InitializeAccount, Revoke, FreezeAccount) fall through to the default case,
// which returns `undefined` and the UI renders as raw hex.

import { PublicKey } from '@solana/web3.js';

import { readU8, readU64LE } from './bytes';
import type { TokenInstructionName } from './const';

type AccountEntry = { pubkey: PublicKey; isSigner: boolean; isWritable: boolean };

export type LabeledAccount = AccountEntry & { label: string };

export type DecodedParams = {
    fields: { label: string; value: string }[];
    accounts: LabeledAccount[];
};

// ── Byte-layout constants ──────────────────────────────────────────────
// SPL Token instruction data is packed as: [discriminator(1), ...payload]
const AFTER_DISCRIMINATOR = 1;
const AMOUNT_LEN = 8;
const AFTER_AMOUNT = AFTER_DISCRIMINATOR + AMOUNT_LEN; // u64 amount ends at byte 9
const DECIMALS_LEN = 1;
const PUBKEY_LEN = 32;

// Minimum data length required to decode each instruction type.
// If data is shorter, the decoder falls back to raw hex to avoid showing wrong values.
const MIN_LEN_AMOUNT = AFTER_DISCRIMINATOR + AMOUNT_LEN; // 9: Transfer, Approve, MintTo, Burn
const MIN_LEN_AMOUNT_DECIMALS = MIN_LEN_AMOUNT + DECIMALS_LEN; // 10: TransferChecked, etc.
const MIN_LEN_CLOSE = AFTER_DISCRIMINATOR; // 1: CloseAccount (discriminator only)
const MIN_LEN_SET_AUTHORITY = 3; // discriminator + authority_type + option_tag

// SetAuthority layout: [discriminator(1), authority_type(1), option_tag(1), ?new_authority(32)]
const SET_AUTHORITY_TYPE_OFFSET = AFTER_DISCRIMINATOR;
const SET_AUTHORITY_OPTION_TAG_OFFSET = 2;
const SET_AUTHORITY_PUBKEY_OFFSET = 3;
const SET_AUTHORITY_MIN_LEN_WITH_PUBKEY = SET_AUTHORITY_PUBKEY_OFFSET + PUBKEY_LEN;
const OPTION_SOME = 1;

/* eslint-disable sort-keys-fix/sort-keys-fix */
const MIN_DATA_LEN: Partial<Record<TokenInstructionName, number>> = {
    Transfer: MIN_LEN_AMOUNT,
    Approve: MIN_LEN_AMOUNT,
    MintTo: MIN_LEN_AMOUNT,
    Burn: MIN_LEN_AMOUNT,
    CloseAccount: MIN_LEN_CLOSE,
    SetAuthority: MIN_LEN_SET_AUTHORITY,
    TransferChecked: MIN_LEN_AMOUNT_DECIMALS,
    ApproveChecked: MIN_LEN_AMOUNT_DECIMALS,
    MintToChecked: MIN_LEN_AMOUNT_DECIMALS,
    BurnChecked: MIN_LEN_AMOUNT_DECIMALS,
};
/* eslint-enable sort-keys-fix/sort-keys-fix */

// ── Account layouts ────────────────────────────────────────────────────
// Each SPL Token instruction expects a fixed sequence of named accounts,
// optionally followed by multisig signer accounts. The layout defines the
// role of each positional account.
// See: https://github.com/solana-program/token/blob/main/interface/src/instruction.rs

type AccountRole = { role: string };
type AccountLayout = readonly AccountRole[];

function roles(...names: string[]): AccountLayout {
    return names.map(role => ({ role }));
}

const LAYOUT = {
    approve: roles('Source', 'Delegate', 'Owner'),
    approveChecked: roles('Source', 'Mint', 'Delegate', 'Owner'),
    burn: roles('Account', 'Mint', 'Owner/Delegate'),
    burnChecked: roles('Account', 'Mint', 'Owner/Delegate'),
    closeAccount: roles('Account', 'Destination', 'Owner'),
    mintTo: roles('Mint', 'Destination', 'Mint Authority'),
    mintToChecked: roles('Mint', 'Destination', 'Mint Authority'),
    setAuthority: roles('Account', 'Current Authority'),
    transfer: roles('Source', 'Destination', 'Owner/Delegate'),
    transferChecked: roles('Source', 'Mint', 'Destination', 'Owner/Delegate'),
};

export function decodeSubInstructionParams(
    typeName: TokenInstructionName | 'Unknown',
    data: Uint8Array,
    accounts: AccountEntry[],
): DecodedParams | undefined {
    // `typeName` comes from `typeNameByDiscriminator` in const.ts, which maps
    // the first byte of instruction data (Rust enum variant index) to a human-readable name.
    const minLen = typeName !== 'Unknown' ? MIN_DATA_LEN[typeName] : undefined;
    if (minLen !== undefined && data.length < minLen) return undefined;

    switch (typeName) {
        case 'Transfer':
            return {
                accounts: labelAccounts(accounts, LAYOUT.transfer),
                fields: [{ label: 'Amount', value: readU64LE(data, AFTER_DISCRIMINATOR).toString() }],
            };

        case 'Approve':
            return {
                accounts: labelAccounts(accounts, LAYOUT.approve),
                fields: [{ label: 'Amount', value: readU64LE(data, AFTER_DISCRIMINATOR).toString() }],
            };

        case 'MintTo':
            return {
                accounts: labelAccounts(accounts, LAYOUT.mintTo),
                fields: [{ label: 'Amount', value: readU64LE(data, AFTER_DISCRIMINATOR).toString() }],
            };

        case 'Burn':
            return {
                accounts: labelAccounts(accounts, LAYOUT.burn),
                fields: [{ label: 'Amount', value: readU64LE(data, AFTER_DISCRIMINATOR).toString() }],
            };

        case 'CloseAccount':
            return {
                accounts: labelAccounts(accounts, LAYOUT.closeAccount),
                fields: [],
            };

        case 'SetAuthority':
            // See AuthorityType enum: https://github.com/solana-program/token/blob/main/interface/src/instruction.rs#L748
            return {
                accounts: labelAccounts(accounts, LAYOUT.setAuthority),
                fields: [
                    { label: 'Authority Type', value: authorityTypeName(readU8(data, SET_AUTHORITY_TYPE_OFFSET)) },
                    { label: 'New Authority', value: readOptionalAuthority(data) },
                ],
            };

        case 'TransferChecked':
            return {
                accounts: labelAccounts(accounts, LAYOUT.transferChecked),
                fields: [
                    { label: 'Amount', value: readU64LE(data, AFTER_DISCRIMINATOR).toString() },
                    { label: 'Decimals', value: readU8(data, AFTER_AMOUNT).toString() },
                ],
            };

        case 'ApproveChecked':
            return {
                accounts: labelAccounts(accounts, LAYOUT.approveChecked),
                fields: [
                    { label: 'Amount', value: readU64LE(data, AFTER_DISCRIMINATOR).toString() },
                    { label: 'Decimals', value: readU8(data, AFTER_AMOUNT).toString() },
                ],
            };

        case 'MintToChecked':
            return {
                accounts: labelAccounts(accounts, LAYOUT.mintToChecked),
                fields: [
                    { label: 'Amount', value: readU64LE(data, AFTER_DISCRIMINATOR).toString() },
                    { label: 'Decimals', value: readU8(data, AFTER_AMOUNT).toString() },
                ],
            };

        case 'BurnChecked':
            return {
                accounts: labelAccounts(accounts, LAYOUT.burnChecked),
                fields: [
                    { label: 'Amount', value: readU64LE(data, AFTER_DISCRIMINATOR).toString() },
                    { label: 'Decimals', value: readU8(data, AFTER_AMOUNT).toString() },
                ],
            };

        default:
            return undefined;
    }
}

// SPL Token instructions support multisig owners/delegates. The `layout` defines the
// named positional accounts; any remaining accounts are additional signers required to
// meet the multisig threshold.
// See: https://github.com/solana-program/token/blob/main/program/src/processor.rs#L988
function labelAccounts(accounts: AccountEntry[], layout: AccountLayout): LabeledAccount[] {
    return accounts.map((account, i) => ({
        ...account,
        label: i < layout.length ? layout[i].role : `Signer ${i - layout.length + 1}`,
    }));
}

// Reads the COption<Pubkey> from a SetAuthority instruction.
// Layout: [discriminator(1), authority_type(1), option_tag(1), ?new_authority(32)]
// The option_tag byte is 1 (Some) when a new authority is present, 0 (None) otherwise.
function readOptionalAuthority(data: Uint8Array): string {
    const hasAuthority =
        data.length >= SET_AUTHORITY_MIN_LEN_WITH_PUBKEY && data[SET_AUTHORITY_OPTION_TAG_OFFSET] === OPTION_SOME;
    if (!hasAuthority) return '(none)';
    return new PublicKey(data.slice(SET_AUTHORITY_PUBKEY_OFFSET, SET_AUTHORITY_MIN_LEN_WITH_PUBKEY)).toBase58();
}

// Maps the AuthorityType enum to a human-readable name.
// https://github.com/solana-program/token/blob/main/interface/src/instruction.rs#L748
function authorityTypeName(type: number): string {
    switch (type) {
        case 0:
            return 'MintTokens';
        case 1:
            return 'FreezeAccount';
        case 2:
            return 'AccountOwner';
        case 3:
            return 'CloseAccount';
        default:
            return `Unknown (${type})`;
    }
}
