import bs58 from 'bs58';

import { readU64LE, readUint16LE, readUint32LE } from '@/app/shared/lib/bytes';

import { sanitizeDisplayString } from './sanitize';
import { DecodedValue, LayoutField, Region } from './types';

export const SPL_MINT_SIZE = 82;

export const SPL_MINT_LAYOUT = [
    { id: 'mint.mintAuthorityOption', kind: 'option', length: 4, name: 'Mint Authority (COption tag)', start: 0 },
    { id: 'mint.mintAuthority', kind: 'authority', length: 32, name: 'Mint Authority', start: 4 },
    { id: 'mint.supply', kind: 'amount', length: 8, name: 'Supply', start: 36 },
    { id: 'mint.decimals', kind: 'scalar', length: 1, name: 'Decimals', start: 44 },
    { id: 'mint.isInitialized', kind: 'scalar', length: 1, name: 'Is Initialized', start: 45 },
    { id: 'mint.freezeAuthorityOption', kind: 'option', length: 4, name: 'Freeze Authority (COption tag)', start: 46 },
    { id: 'mint.freezeAuthority', kind: 'authority', length: 32, name: 'Freeze Authority', start: 50 },
] as const satisfies readonly LayoutField[];

export interface ParsedMintInfo {
    mintAuthority: { toBase58(): string } | null;
    supply: string;
    decimals: number;
    isInitialized: boolean;
    freezeAuthority: { toBase58(): string } | null;
}

export function buildSplMintRegions(raw: Uint8Array, parsed: ParsedMintInfo | undefined): Region[] {
    if (raw.length < SPL_MINT_SIZE) {
        throw new RangeError(`SPL mint data must be ≥ ${SPL_MINT_SIZE} bytes, got ${raw.length}`);
    }
    const regions: Region[] = SPL_MINT_LAYOUT.map(field => ({
        ...field,
        decodedValue: decodeMintField(field.id, raw, parsed),
    }));
    if (raw.length > SPL_MINT_SIZE) {
        regions.push(...walkTokenExtensions(raw, SPL_MINT_SIZE));
    }
    return regions;
}

function decodeMintField(fieldId: string, raw: Uint8Array, parsed: ParsedMintInfo | undefined): DecodedValue {
    switch (fieldId) {
        case 'mint.mintAuthorityOption':
            return { kind: 'option', present: readUint32LE(raw, 0) === 1 };
        case 'mint.mintAuthority':
            return decodeCOptionPubkey(raw, 0, 4, parsed?.mintAuthority);
        case 'mint.supply': {
            const rawAmount = parsed?.supply !== undefined ? BigInt(parsed.supply) : readU64LE(raw, 36);
            return { decimals: parsed?.decimals, kind: 'amount', raw: rawAmount };
        }
        case 'mint.decimals':
            return { kind: 'scalar', value: parsed?.decimals ?? raw[44] };
        case 'mint.isInitialized': {
            const initialized = parsed?.isInitialized ?? raw[45] === 1;
            return { kind: 'scalar', label: initialized ? 'Initialized' : 'Uninitialized', value: initialized ? 'Yes' : 'No' };
        }
        case 'mint.freezeAuthorityOption':
            return { kind: 'option', present: readUint32LE(raw, 46) === 1 };
        case 'mint.freezeAuthority':
            return decodeCOptionPubkey(raw, 46, 50, parsed?.freezeAuthority);
        default:
            return { kind: 'unparsed', reason: 'no-jsonparsed' };
    }
}

function decodeCOptionPubkey(
    raw: Uint8Array,
    tagOffset: number,
    pubkeyOffset: number,
    parsedPubkey: { toBase58(): string } | null | undefined,
): DecodedValue {
    const present = readUint32LE(raw, tagOffset) === 1;
    if (!present) return { base58: '', isNone: true, kind: 'pubkey' };
    if (parsedPubkey) return { base58: parsedPubkey.toBase58(), kind: 'pubkey' };
    return { base58: bs58.encode(raw.slice(pubkeyOffset, pubkeyOffset + 32)), kind: 'pubkey' };
}

export const SPL_TOKEN_ACCOUNT_SIZE = 165;

export const SPL_TOKEN_ACCOUNT_LAYOUT = [
    { id: 'token.mint', kind: 'pubkey', length: 32, name: 'Mint', start: 0 },
    { id: 'token.owner', kind: 'authority', length: 32, name: 'Owner', start: 32 },
    { id: 'token.amount', kind: 'amount', length: 8, name: 'Amount', start: 64 },
    { id: 'token.delegateOption', kind: 'option', length: 4, name: 'Delegate (COption tag)', start: 72 },
    { id: 'token.delegate', kind: 'pubkey', length: 32, name: 'Delegate', start: 76 },
    { id: 'token.state', kind: 'scalar', length: 1, name: 'State', start: 108 },
    { id: 'token.isNativeOption', kind: 'option', length: 4, name: 'Is Native (COption tag)', start: 109 },
    { id: 'token.nativeAmount', kind: 'amount', length: 8, name: 'Rent-Exempt Reserve', start: 113 },
    { id: 'token.delegatedAmount', kind: 'amount', length: 8, name: 'Delegated Amount', start: 121 },
    { id: 'token.closeAuthorityOption', kind: 'option', length: 4, name: 'Close Authority (COption tag)', start: 129 },
    { id: 'token.closeAuthority', kind: 'pubkey', length: 32, name: 'Close Authority', start: 133 },
] as const satisfies readonly LayoutField[];

export type TokenAccountState = 'uninitialized' | 'initialized' | 'frozen';

export interface ParsedTokenAccountInfo {
    mint: { toBase58(): string };
    owner: { toBase58(): string };
    tokenAmount: { amount: string; decimals: number };
    delegate?: { toBase58(): string };
    delegatedAmount?: { amount: string; decimals: number };
    isNative: boolean;
    rentExemptReserve?: { amount: string; decimals: number };
    state: TokenAccountState;
    closeAuthority?: { toBase58(): string };
}

const STATE_LABELS: Record<number, TokenAccountState> = {
    0: 'uninitialized',
    1: 'initialized',
    2: 'frozen',
};

export function buildSplTokenAccountRegions(
    raw: Uint8Array,
    parsed: ParsedTokenAccountInfo | undefined,
): Region[] {
    if (raw.length < SPL_TOKEN_ACCOUNT_SIZE) {
        throw new RangeError(
            `SPL token account data must be ≥ ${SPL_TOKEN_ACCOUNT_SIZE} bytes, got ${raw.length}`,
        );
    }
    const regions: Region[] = SPL_TOKEN_ACCOUNT_LAYOUT.map(field => ({
        ...field,
        decodedValue: decodeTokenAccountField(field.id, raw, parsed),
    }));
    if (raw.length > SPL_TOKEN_ACCOUNT_SIZE) {
        regions.push(...walkTokenExtensions(raw, SPL_TOKEN_ACCOUNT_SIZE));
    }
    return regions;
}

function decodeTokenAccountField(
    fieldId: string,
    raw: Uint8Array,
    parsed: ParsedTokenAccountInfo | undefined,
): DecodedValue {
    switch (fieldId) {
        case 'token.mint':
            return parsed?.mint
                ? { base58: parsed.mint.toBase58(), kind: 'pubkey' }
                : { base58: bs58.encode(raw.slice(0, 32)), kind: 'pubkey' };
        case 'token.owner':
            return parsed?.owner
                ? { base58: parsed.owner.toBase58(), kind: 'pubkey' }
                : { base58: bs58.encode(raw.slice(32, 64)), kind: 'pubkey' };
        case 'token.amount': {
            const amountStr = parsed?.tokenAmount?.amount;
            const rawAmount = amountStr !== undefined ? BigInt(amountStr) : readU64LE(raw, 64);
            return { decimals: parsed?.tokenAmount?.decimals, kind: 'amount', raw: rawAmount };
        }
        case 'token.delegateOption':
            return { kind: 'option', present: readUint32LE(raw, 72) === 1 };
        case 'token.delegate':
            return decodeCOptionPubkey(raw, 72, 76, parsed?.delegate);
        case 'token.state': {
            const stateByte = raw[108];
            const label = parsed?.state ?? STATE_LABELS[stateByte] ?? 'uninitialized';
            return { kind: 'scalar', label, value: stateByte };
        }
        case 'token.isNativeOption':
            return { kind: 'option', present: readUint32LE(raw, 109) === 1 };
        case 'token.nativeAmount': {
            const isNative = readUint32LE(raw, 109) === 1;
            if (!isNative) {
                return { kind: 'unparsed', reason: 'no-jsonparsed' };
            }
            const rawAmount = parsed?.rentExemptReserve
                ? BigInt(parsed.rentExemptReserve.amount)
                : readU64LE(raw, 113);
            return { decimals: parsed?.rentExemptReserve?.decimals, kind: 'amount', raw: rawAmount };
        }
        case 'token.delegatedAmount': {
            const rawAmount = parsed?.delegatedAmount
                ? BigInt(parsed.delegatedAmount.amount)
                : readU64LE(raw, 121);
            return { decimals: parsed?.delegatedAmount?.decimals, kind: 'amount', raw: rawAmount };
        }
        case 'token.closeAuthorityOption':
            return { kind: 'option', present: readUint32LE(raw, 129) === 1 };
        case 'token.closeAuthority':
            return decodeCOptionPubkey(raw, 129, 133, parsed?.closeAuthority);
        default:
            return { kind: 'unparsed', reason: 'no-jsonparsed' };
    }
}

// ---- Token-2022 TLV walker -------------------------------------------------

const ACCOUNT_TYPE_LABELS: Record<number, string> = {
    0: 'Uninitialized',
    1: 'Mint',
    2: 'Account',
};

/* eslint-disable sort-keys-fix/sort-keys-fix -- numeric-keyed map for Token-2022 extension discriminators; natural-order reads better than lexicographic */
export const EXTENSION_NAMES: Record<number, string> = {
    0: 'Uninitialized',
    1: 'TransferFeeConfig',
    2: 'TransferFeeAmount',
    3: 'MintCloseAuthority',
    4: 'ConfidentialTransferMint',
    5: 'ConfidentialTransferAccount',
    6: 'DefaultAccountState',
    7: 'ImmutableOwner',
    8: 'MemoTransfer',
    9: 'NonTransferable',
    10: 'InterestBearingConfig',
    11: 'CpiGuard',
    12: 'PermanentDelegate',
    13: 'NonTransferableAccount',
    14: 'TransferHook',
    15: 'TransferHookAccount',
    16: 'ConfidentialTransferFeeConfig',
    17: 'ConfidentialTransferFeeAmount',
    18: 'MetadataPointer',
    19: 'TokenMetadata',
    20: 'GroupPointer',
    21: 'GroupMemberPointer',
    22: 'TokenGroup',
    23: 'TokenGroupMember',
    24: 'ScaledUiAmountConfig',
    25: 'PausableConfig',
    26: 'PausableAccount',
};
/* eslint-enable sort-keys-fix/sort-keys-fix */

// Walks the Token-2022 TLV tail (1-byte account-type discriminator + sequence of
// {u16 type, u16 length, [length] data}). Known extensions are dispatched to
// per-extension decoders; unknown or corrupt entries emit a single opaque or
// 'truncated' region and the loop continues or terminates safely.
export function* walkTokenExtensions(raw: Uint8Array, baseSize: number): Generator<Region> {
    if (raw.length <= baseSize) return;

    const accountTypeByte = raw[baseSize];
    yield {
        decodedValue: {
            kind: 'scalar',
            label: ACCOUNT_TYPE_LABELS[accountTypeByte] ?? `Unknown (${accountTypeByte})`,
            value: accountTypeByte,
        },
        id: `ext.accountType@${baseSize}`,
        kind: 'scalar',
        length: 1,
        name: 'Token-2022 Account Type',
        start: baseSize,
    };

    let pos = baseSize + 1;
    let extIndex = 0;

    while (pos < raw.length) {
        if (pos + 4 > raw.length) {
            yield {
                decodedValue: { kind: 'unparsed', reason: 'truncated' },
                id: `ext.${extIndex}.truncated@${pos}`,
                kind: 'neutral',
                length: raw.length - pos,
                name: 'Truncated Extension Header',
                start: pos,
            };
            return;
        }

        const extType = readUint16LE(raw, pos);
        const extLen = readUint16LE(raw, pos + 2);
        const extName = EXTENSION_NAMES[extType] ?? `Unknown (#${extType})`;

        yield {
            decodedValue: { kind: 'scalar', label: `${extName}, length ${extLen}`, value: extType },
            id: `ext.${extIndex}.header@${pos}`,
            kind: 'option',
            length: 4,
            name: `${extName} — Header`,
            start: pos,
        };
        pos += 4;

        if (extLen === 0) {
            extIndex++;
            continue;
        }

        if (pos + extLen > raw.length) {
            yield {
                decodedValue: { kind: 'unparsed', reason: 'truncated' },
                id: `ext.${extIndex}.truncated@${pos}`,
                kind: 'neutral',
                length: raw.length - pos,
                name: `${extName} — Truncated Data`,
                start: pos,
            };
            return;
        }

        const decoder = EXTENSION_DECODERS[extType];
        if (decoder) {
            yield* decoder(raw, pos, extLen, extIndex, extName);
        } else {
            const isKnown = extType in EXTENSION_NAMES;
            yield {
                decodedValue: isKnown
                    ? { kind: 'text', value: `${extLen} byte(s)` }
                    : { kind: 'unparsed', reason: 'unknown-ext' },
                id: `ext.${extIndex}.data@${pos}`,
                kind: 'neutral',
                length: extLen,
                name: `${extName} — Data`,
                start: pos,
            };
        }
        pos += extLen;
        extIndex++;
    }
}

// ---- Per-extension sub-region decoders -------------------------------------

type ExtensionDecoder = (
    raw: Uint8Array,
    start: number,
    length: number,
    extIndex: number,
    extName: string,
) => Generator<Region>;

function decodeOptionalNonZeroPubkey(raw: Uint8Array, start: number): DecodedValue {
    const slice = raw.slice(start, start + 32);
    const isNone = slice.every(b => b === 0);
    if (isNone) return { base58: '', isNone: true, kind: 'pubkey' };
    return { base58: bs58.encode(slice), kind: 'pubkey' };
}

function* decodeMintCloseAuthority(raw: Uint8Array, start: number, length: number, extIndex: number): Generator<Region> {
    if (length < 32) return;
    yield {
        decodedValue: decodeOptionalNonZeroPubkey(raw, start),
        id: `ext.${extIndex}.closeAuthority@${start}`,
        kind: 'authority',
        length: 32,
        name: 'MintCloseAuthority — Close Authority',
        start,
    };
}

function* decodePermanentDelegate(raw: Uint8Array, start: number, length: number, extIndex: number): Generator<Region> {
    if (length < 32) return;
    yield {
        decodedValue: decodeOptionalNonZeroPubkey(raw, start),
        id: `ext.${extIndex}.permanentDelegate@${start}`,
        kind: 'authority',
        length: 32,
        name: 'PermanentDelegate — Delegate',
        start,
    };
}

function* decodeMetadataPointer(raw: Uint8Array, start: number, length: number, extIndex: number): Generator<Region> {
    if (length < 64) return;
    yield {
        decodedValue: decodeOptionalNonZeroPubkey(raw, start),
        id: `ext.${extIndex}.metadataPointer.authority@${start}`,
        kind: 'authority',
        length: 32,
        name: 'MetadataPointer — Authority',
        start,
    };
    yield {
        decodedValue: decodeOptionalNonZeroPubkey(raw, start + 32),
        id: `ext.${extIndex}.metadataPointer.address@${start + 32}`,
        kind: 'pubkey',
        length: 32,
        name: 'MetadataPointer — Metadata Address',
        start: start + 32,
    };
}

function* decodeInterestBearingConfig(
    raw: Uint8Array,
    start: number,
    length: number,
    extIndex: number,
): Generator<Region> {
    if (length < 52) return;
    const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
    yield {
        decodedValue: decodeOptionalNonZeroPubkey(raw, start),
        id: `ext.${extIndex}.ibc.rateAuthority@${start}`,
        kind: 'authority',
        length: 32,
        name: 'InterestBearing — Rate Authority',
        start,
    };
    yield {
        decodedValue: { kind: 'text', value: view.getBigInt64(start + 32, true).toString() },
        id: `ext.${extIndex}.ibc.initTs@${start + 32}`,
        kind: 'scalar',
        length: 8,
        name: 'InterestBearing — Initialization Timestamp',
        start: start + 32,
    };
    yield {
        decodedValue: { kind: 'text', value: `${view.getInt16(start + 40, true)} bps` },
        id: `ext.${extIndex}.ibc.preRate@${start + 40}`,
        kind: 'scalar',
        length: 2,
        name: 'InterestBearing — Pre-update Average Rate',
        start: start + 40,
    };
    yield {
        decodedValue: { kind: 'text', value: view.getBigInt64(start + 42, true).toString() },
        id: `ext.${extIndex}.ibc.lastTs@${start + 42}`,
        kind: 'scalar',
        length: 8,
        name: 'InterestBearing — Last Update Timestamp',
        start: start + 42,
    };
    yield {
        decodedValue: { kind: 'text', value: `${view.getInt16(start + 50, true)} bps` },
        id: `ext.${extIndex}.ibc.currentRate@${start + 50}`,
        kind: 'scalar',
        length: 2,
        name: 'InterestBearing — Current Rate',
        start: start + 50,
    };
}

// Layout: 32 update_authority (optional pubkey) + 32 mint + borsh String name/symbol/uri
// + optional additional_metadata tail. Strings are sanitized; URI is text, never a link.
function* decodeTokenMetadata(
    raw: Uint8Array,
    start: number,
    length: number,
    extIndex: number,
): Generator<Region> {
    const end = start + length;
    if (length < 64 + 4) return; // minimum: 64 pubkeys + 4-byte length prefix for name
    yield {
        decodedValue: decodeOptionalNonZeroPubkey(raw, start),
        id: `ext.${extIndex}.tm.updateAuthority@${start}`,
        kind: 'authority',
        length: 32,
        name: 'TokenMetadata — Update Authority',
        start,
    };
    yield {
        decodedValue: { base58: bs58.encode(raw.slice(start + 32, start + 64)), kind: 'pubkey' },
        id: `ext.${extIndex}.tm.mint@${start + 32}`,
        kind: 'pubkey',
        length: 32,
        name: 'TokenMetadata — Mint',
        start: start + 32,
    };

    let pos = start + 64;
    for (const fieldName of ['Name', 'Symbol', 'URI'] as const) {
        if (pos + 4 > end) return;
        const strLen = readUint32LE(raw, pos);
        if (pos + 4 + strLen > end) {
            yield {
                decodedValue: { kind: 'unparsed', reason: 'truncated' },
                id: `ext.${extIndex}.tm.${fieldName.toLowerCase()}.truncated@${pos}`,
                kind: 'neutral',
                length: end - pos,
                name: `TokenMetadata — ${fieldName} (truncated)`,
                start: pos,
            };
            return;
        }
        const bytes = raw.slice(pos + 4, pos + 4 + strLen);
        const rawText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
        const safeText = sanitizeDisplayString(rawText);
        yield {
            decodedValue: { kind: 'text', value: safeText },
            id: `ext.${extIndex}.tm.${fieldName.toLowerCase()}@${pos}`,
            kind: 'neutral',
            length: 4 + strLen,
            name: `TokenMetadata — ${fieldName}`,
            start: pos,
        };
        pos += 4 + strLen;
    }
    // Any trailing bytes (additional_metadata length + entries) rendered as one opaque region.
    if (pos < end) {
        yield {
            decodedValue: { kind: 'text', value: `${end - pos} byte(s)` },
            id: `ext.${extIndex}.tm.additional@${pos}`,
            kind: 'neutral',
            length: end - pos,
            name: 'TokenMetadata — Additional Metadata',
            start: pos,
        };
    }
}

/* eslint-disable sort-keys-fix/sort-keys-fix -- numeric-keyed dispatch; natural order beats lexicographic */
const EXTENSION_DECODERS: Partial<Record<number, ExtensionDecoder>> = {
    3: decodeMintCloseAuthority,
    10: decodeInterestBearingConfig,
    12: decodePermanentDelegate,
    18: decodeMetadataPointer,
    19: decodeTokenMetadata,
};
/* eslint-enable sort-keys-fix/sort-keys-fix */
