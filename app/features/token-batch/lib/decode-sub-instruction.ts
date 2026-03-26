// Decoder for SPL Token sub-instructions embedded in a batched token instruction.
//
// Uses @solana-program/token-2022 instruction data decoders for field extraction.
// The batch wire format itself has no SDK decoder — only individual sub-instruction
// data payloads are decoded here.

import {
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
import { formatDecoded } from './format-sub-instruction';
import type {
    AccountEntry,
    DecodedParams,
    RawAmount,
    RawCheckedAmount,
    RawCloseAccount,
    RawDecoded,
    RawSetAuthority,
} from './types';

export type { DecodedParams, LabeledAccount } from './types';

export function decodeSubInstructionParams(
    typeName: TokenInstructionName | 'Unknown',
    data: Uint8Array,
    accounts: AccountEntry[],
    decimals?: number,
): DecodedParams | undefined {
    try {
        const raw = decodeByType(typeName, data, accounts);
        if (!raw) return undefined;
        return formatDecoded(raw, decimals);
    } catch {
        // Decoder throws on truncated/malformed data — fall back to raw hex.
        return undefined;
    }
}

// Token-2022 extension instructions use a nested sub-discriminator scheme
// that varies per extension, so we only decode the common base instructions
// where the wire format is straightforward.
function decodeByType(
    typeName: TokenInstructionName | 'Unknown',
    data: Uint8Array,
    accounts: AccountEntry[],
): RawDecoded | undefined {
    switch (typeName) {
        case 'Transfer':
            return decodeTransfer(data, accounts);
        case 'Approve':
            return decodeApprove(data, accounts);
        case 'MintTo':
            return decodeMintTo(data, accounts);
        case 'Burn':
            return decodeBurn(data, accounts);
        case 'CloseAccount':
            return decodeCloseAccount(data, accounts);
        case 'SetAuthority':
            return decodeSetAuthority(data, accounts);
        case 'TransferChecked':
            return decodeTransferChecked(data, accounts);
        case 'ApproveChecked':
            return decodeApproveChecked(data, accounts);
        case 'MintToChecked':
            return decodeMintToChecked(data, accounts);
        case 'BurnChecked':
            return decodeBurnChecked(data, accounts);
        default:
            return undefined;
    }
}

// ── Per-instruction decoders ─────────────────────────────────────────

function decodeTransfer(data: Uint8Array, accounts: AccountEntry[]): RawAmount {
    const { amount } = getTransferInstructionDataDecoder().decode(data);
    return { accounts, amount, type: 'transfer' };
}

function decodeApprove(data: Uint8Array, accounts: AccountEntry[]): RawAmount {
    const { amount } = getApproveInstructionDataDecoder().decode(data);
    return { accounts, amount, type: 'approve' };
}

function decodeMintTo(data: Uint8Array, accounts: AccountEntry[]): RawAmount {
    const { amount } = getMintToInstructionDataDecoder().decode(data);
    return { accounts, amount, type: 'mintTo' };
}

function decodeBurn(data: Uint8Array, accounts: AccountEntry[]): RawAmount {
    const { amount } = getBurnInstructionDataDecoder().decode(data);
    return { accounts, amount, type: 'burn' };
}

// CloseAccount has no payload beyond the discriminator, but we still
// need at least 1 byte (the discriminator itself) to consider it valid.
function decodeCloseAccount(data: Uint8Array, accounts: AccountEntry[]): RawCloseAccount | undefined {
    if (data.length < 1) return undefined;
    return { accounts, type: 'closeAccount' };
}

function decodeSetAuthority(data: Uint8Array, accounts: AccountEntry[]): RawSetAuthority {
    const { authorityType, newAuthority } = getSetAuthorityInstructionDataDecoder().decode(data);
    return {
        accounts,
        authorityType,
        newAuthority: newAuthority.__option === 'Some' ? newAuthority.value : undefined,
        type: 'setAuthority',
    };
}

function decodeTransferChecked(data: Uint8Array, accounts: AccountEntry[]): RawCheckedAmount {
    const { amount, decimals } = getTransferCheckedInstructionDataDecoder().decode(data);
    return { accounts, amount, decimals, type: 'transferChecked' };
}

function decodeApproveChecked(data: Uint8Array, accounts: AccountEntry[]): RawCheckedAmount {
    const { amount, decimals } = getApproveCheckedInstructionDataDecoder().decode(data);
    return { accounts, amount, decimals, type: 'approveChecked' };
}

function decodeMintToChecked(data: Uint8Array, accounts: AccountEntry[]): RawCheckedAmount {
    const { amount, decimals } = getMintToCheckedInstructionDataDecoder().decode(data);
    return { accounts, amount, decimals, type: 'mintToChecked' };
}

function decodeBurnChecked(data: Uint8Array, accounts: AccountEntry[]): RawCheckedAmount {
    const { amount, decimals } = getBurnCheckedInstructionDataDecoder().decode(data);
    return { accounts, amount, decimals, type: 'burnChecked' };
}
