// Decoder for SPL Token sub-instructions embedded in a batched token instruction.
//
// Uses @solana-program/token-2022 instruction data decoders for field extraction.
// The batch wire format itself has no SDK decoder — only individual sub-instruction
// data payloads are decoded here.
//
// Only the most common sub-instructions are decoded. Others (e.g. InitializeMint,
// InitializeAccount, Revoke, FreezeAccount) fall through to the default case,
// which returns `undefined` and the UI renders as raw hex.

import { PublicKey } from '@solana/web3.js';
import {
    AuthorityType,
    getApproveCheckedInstructionDataDecoder,
    getApproveInstructionDataDecoder,
    getBurnCheckedInstructionDataDecoder,
    getBurnInstructionDataDecoder,
    getMintToCheckedInstructionDataDecoder,
    getMintToInstructionDataDecoder,
    getSetAuthorityInstructionDataDecoder,
    getTransferCheckedInstructionDataDecoder,
    getTransferInstructionDataDecoder,
} from '@solana-program/token-2022';

import type { TokenInstructionName } from './const';

type AccountEntry = { pubkey: PublicKey; isSigner: boolean; isWritable: boolean };

export type LabeledAccount = AccountEntry & { label: string };

export type DecodedParams = {
    fields: { label: string; value: string }[];
    accounts: LabeledAccount[];
};

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

// Lazily initialized decoders — created once on first use.
const decoders = {
    approve: getApproveInstructionDataDecoder(),
    approveChecked: getApproveCheckedInstructionDataDecoder(),
    burn: getBurnInstructionDataDecoder(),
    burnChecked: getBurnCheckedInstructionDataDecoder(),
    mintTo: getMintToInstructionDataDecoder(),
    mintToChecked: getMintToCheckedInstructionDataDecoder(),
    setAuthority: getSetAuthorityInstructionDataDecoder(),
    transfer: getTransferInstructionDataDecoder(),
    transferChecked: getTransferCheckedInstructionDataDecoder(),
};

export function decodeSubInstructionParams(
    typeName: TokenInstructionName | 'Unknown',
    data: Uint8Array,
    accounts: AccountEntry[],
): DecodedParams | undefined {
    try {
        return decodeByType(typeName, data, accounts);
    } catch {
        // Decoder throws on truncated/malformed data — fall back to raw hex.
        return undefined;
    }
}

function decodeByType(
    typeName: TokenInstructionName | 'Unknown',
    data: Uint8Array,
    accounts: AccountEntry[],
): DecodedParams | undefined {
    switch (typeName) {
        case 'Transfer': {
            const { amount } = decoders.transfer.decode(data);
            return {
                accounts: labelAccounts(accounts, LAYOUT.transfer),
                fields: [{ label: 'Amount', value: amount.toString() }],
            };
        }

        case 'Approve': {
            const { amount } = decoders.approve.decode(data);
            return {
                accounts: labelAccounts(accounts, LAYOUT.approve),
                fields: [{ label: 'Amount', value: amount.toString() }],
            };
        }

        case 'MintTo': {
            const { amount } = decoders.mintTo.decode(data);
            return {
                accounts: labelAccounts(accounts, LAYOUT.mintTo),
                fields: [{ label: 'Amount', value: amount.toString() }],
            };
        }

        case 'Burn': {
            const { amount } = decoders.burn.decode(data);
            return {
                accounts: labelAccounts(accounts, LAYOUT.burn),
                fields: [{ label: 'Amount', value: amount.toString() }],
            };
        }

        case 'CloseAccount':
            // CloseAccount has no payload beyond the discriminator, but we still
            // need at least 1 byte (the discriminator itself) to consider it valid.
            if (data.length < 1) return undefined;
            return {
                accounts: labelAccounts(accounts, LAYOUT.closeAccount),
                fields: [],
            };

        case 'SetAuthority': {
            const { authorityType, newAuthority } = decoders.setAuthority.decode(data);
            return {
                accounts: labelAccounts(accounts, LAYOUT.setAuthority),
                fields: [
                    { label: 'Authority Type', value: AuthorityType[authorityType] ?? `Unknown (${authorityType})` },
                    { label: 'New Authority', value: newAuthority.__option === 'Some' ? newAuthority.value : '(none)' },
                ],
            };
        }

        case 'TransferChecked': {
            const { amount, decimals } = decoders.transferChecked.decode(data);
            return {
                accounts: labelAccounts(accounts, LAYOUT.transferChecked),
                fields: [
                    { label: 'Amount', value: amount.toString() },
                    { label: 'Decimals', value: decimals.toString() },
                ],
            };
        }

        case 'ApproveChecked': {
            const { amount, decimals } = decoders.approveChecked.decode(data);
            return {
                accounts: labelAccounts(accounts, LAYOUT.approveChecked),
                fields: [
                    { label: 'Amount', value: amount.toString() },
                    { label: 'Decimals', value: decimals.toString() },
                ],
            };
        }

        case 'MintToChecked': {
            const { amount, decimals } = decoders.mintToChecked.decode(data);
            return {
                accounts: labelAccounts(accounts, LAYOUT.mintToChecked),
                fields: [
                    { label: 'Amount', value: amount.toString() },
                    { label: 'Decimals', value: decimals.toString() },
                ],
            };
        }

        case 'BurnChecked': {
            const { amount, decimals } = decoders.burnChecked.decode(data);
            return {
                accounts: labelAccounts(accounts, LAYOUT.burnChecked),
                fields: [
                    { label: 'Amount', value: amount.toString() },
                    { label: 'Decimals', value: decimals.toString() },
                ],
            };
        }

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
