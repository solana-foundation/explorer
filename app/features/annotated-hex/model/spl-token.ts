import bs58 from 'bs58';

import { readU64LE, readUint16LE, readUint32LE } from '@/app/shared/lib/bytes';

import { sanitizeDisplayString } from './sanitize';
import { DecodedValue, LayoutField, Region } from './types';

export const SPL_MINT_SIZE = 82;

export const SPL_MINT_LAYOUT = [
    { id: 'mint.mintAuthorityOption', name: 'Mint Authority (COption tag)', start: 0, length: 4, kind: 'option' },
    { id: 'mint.mintAuthority', name: 'Mint Authority', start: 4, length: 32, kind: 'authority' },
    { id: 'mint.supply', name: 'Supply', start: 36, length: 8, kind: 'amount' },
    { id: 'mint.decimals', name: 'Decimals', start: 44, length: 1, kind: 'scalar' },
    { id: 'mint.isInitialized', name: 'Is Initialized', start: 45, length: 1, kind: 'scalar' },
    { id: 'mint.freezeAuthorityOption', name: 'Freeze Authority (COption tag)', start: 46, length: 4, kind: 'option' },
    { id: 'mint.freezeAuthority', name: 'Freeze Authority', start: 50, length: 32, kind: 'authority' },
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
            const rawAmount = parsed ? BigInt(parsed.supply) : readU64LE(raw, 36);
            return { kind: 'amount', raw: rawAmount, decimals: parsed?.decimals };
        }
        case 'mint.decimals':
            return { kind: 'scalar', value: parsed?.decimals ?? raw[44] };
        case 'mint.isInitialized': {
            const initialized = parsed ? parsed.isInitialized : raw[45] === 1;
            return { kind: 'scalar', value: initialized ? 'Yes' : 'No', label: initialized ? 'Initialized' : 'Uninitialized' };
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
    if (!present) return { kind: 'pubkey', base58: '', isNone: true };
    if (parsedPubkey) return { kind: 'pubkey', base58: parsedPubkey.toBase58() };
    return { kind: 'pubkey', base58: bs58.encode(raw.slice(pubkeyOffset, pubkeyOffset + 32)) };
}

export const SPL_TOKEN_ACCOUNT_SIZE = 165;

export const SPL_TOKEN_ACCOUNT_LAYOUT = [
    { id: 'token.mint', name: 'Mint', start: 0, length: 32, kind: 'pubkey' },
    { id: 'token.owner', name: 'Owner', start: 32, length: 32, kind: 'authority' },
    { id: 'token.amount', name: 'Amount', start: 64, length: 8, kind: 'amount' },
    { id: 'token.delegateOption', name: 'Delegate (COption tag)', start: 72, length: 4, kind: 'option' },
    { id: 'token.delegate', name: 'Delegate', start: 76, length: 32, kind: 'pubkey' },
    { id: 'token.state', name: 'State', start: 108, length: 1, kind: 'scalar' },
    { id: 'token.isNativeOption', name: 'Is Native (COption tag)', start: 109, length: 4, kind: 'option' },
    { id: 'token.nativeAmount', name: 'Rent-Exempt Reserve', start: 113, length: 8, kind: 'amount' },
    { id: 'token.delegatedAmount', name: 'Delegated Amount', start: 121, length: 8, kind: 'amount' },
    { id: 'token.closeAuthorityOption', name: 'Close Authority (COption tag)', start: 129, length: 4, kind: 'option' },
    { id: 'token.closeAuthority', name: 'Close Authority', start: 133, length: 32, kind: 'pubkey' },
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
            return parsed
                ? { kind: 'pubkey', base58: parsed.mint.toBase58() }
                : { kind: 'pubkey', base58: bs58.encode(raw.slice(0, 32)) };
        case 'token.owner':
            return parsed
                ? { kind: 'pubkey', base58: parsed.owner.toBase58() }
                : { kind: 'pubkey', base58: bs58.encode(raw.slice(32, 64)) };
        case 'token.amount': {
            const rawAmount = parsed ? BigInt(parsed.tokenAmount.amount) : readU64LE(raw, 64);
            return { kind: 'amount', raw: rawAmount, decimals: parsed?.tokenAmount.decimals };
        }
        case 'token.delegateOption':
            return { kind: 'option', present: readUint32LE(raw, 72) === 1 };
        case 'token.delegate':
            return decodeCOptionPubkey(raw, 72, 76, parsed?.delegate);
        case 'token.state': {
            const stateByte = raw[108];
            const label = parsed?.state ?? STATE_LABELS[stateByte] ?? 'uninitialized';
            return { kind: 'scalar', value: stateByte, label };
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
            return { kind: 'amount', raw: rawAmount, decimals: parsed?.rentExemptReserve?.decimals };
        }
        case 'token.delegatedAmount': {
            const rawAmount = parsed?.delegatedAmount
                ? BigInt(parsed.delegatedAmount.amount)
                : readU64LE(raw, 121);
            return { kind: 'amount', raw: rawAmount, decimals: parsed?.delegatedAmount?.decimals };
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

/**
 * Walks the Token-2022 TLV tail starting at `baseSize` (82 for mints, 165 for token accounts).
 *
 * Emits:
 * - one scalar region for the 1-byte account-type discriminator
 * - per extension: a 4-byte `option`-kind header region labeled with the extension name,
 *   followed by a `neutral`-kind opaque data region sized to the TLV length.
 *
 * Guards:
 * - If only the account-type byte remains (no TLV), emits it and stops.
 * - If a header would overrun `raw.length`, terminates without emitting.
 * - If a TLV data block claims more bytes than remain, emits a single `truncated` region
 *   sized to the remaining bytes and stops (no out-of-bounds slice, no throw).
 * - Zero-length extensions (e.g. ImmutableOwner, NonTransferable) emit header only,
 *   no data region.
 */
export function* walkTokenExtensions(raw: Uint8Array, baseSize: number): Generator<Region> {
    if (raw.length <= baseSize) return;

    const accountTypeByte = raw[baseSize];
    yield {
        id: `ext.accountType@${baseSize}`,
        name: 'Token-2022 Account Type',
        start: baseSize,
        length: 1,
        kind: 'scalar',
        decodedValue: {
            kind: 'scalar',
            value: accountTypeByte,
            label: ACCOUNT_TYPE_LABELS[accountTypeByte] ?? `Unknown (${accountTypeByte})`,
        },
    };

    let pos = baseSize + 1;
    let extIndex = 0;

    while (pos < raw.length) {
        if (pos + 4 > raw.length) {
            yield {
                id: `ext.${extIndex}.truncated@${pos}`,
                name: 'Truncated Extension Header',
                start: pos,
                length: raw.length - pos,
                kind: 'neutral',
                decodedValue: { kind: 'unparsed', reason: 'truncated' },
            };
            return;
        }

        const extType = readUint16LE(raw, pos);
        const extLen = readUint16LE(raw, pos + 2);
        const extName = EXTENSION_NAMES[extType] ?? `Unknown (#${extType})`;

        yield {
            id: `ext.${extIndex}.header@${pos}`,
            name: `${extName} — Header`,
            start: pos,
            length: 4,
            kind: 'option',
            decodedValue: { kind: 'scalar', value: extType, label: `${extName}, length ${extLen}` },
        };
        pos += 4;

        if (extLen === 0) {
            extIndex++;
            continue;
        }

        if (pos + extLen > raw.length) {
            yield {
                id: `ext.${extIndex}.truncated@${pos}`,
                name: `${extName} — Truncated Data`,
                start: pos,
                length: raw.length - pos,
                kind: 'neutral',
                decodedValue: { kind: 'unparsed', reason: 'truncated' },
            };
            return;
        }

        const decoder = EXTENSION_DECODERS[extType];
        if (decoder) {
            yield* decoder(raw, pos, extLen, extIndex, extName);
        } else {
            const isKnown = extType in EXTENSION_NAMES;
            yield {
                id: `ext.${extIndex}.data@${pos}`,
                name: `${extName} — Data`,
                start: pos,
                length: extLen,
                kind: 'neutral',
                decodedValue: isKnown
                    ? { kind: 'text', value: `${extLen} byte(s)` }
                    : { kind: 'unparsed', reason: 'unknown-ext' },
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

/** Token-2022 uses OptionalNonZeroPubkey: 32 bytes, all-zero = None. */
function decodeOptionalNonZeroPubkey(raw: Uint8Array, start: number): DecodedValue {
    const slice = raw.slice(start, start + 32);
    const isNone = slice.every(b => b === 0);
    if (isNone) return { kind: 'pubkey', base58: '', isNone: true };
    return { kind: 'pubkey', base58: bs58.encode(slice) };
}

function* decodeMintCloseAuthority(raw: Uint8Array, start: number, length: number, extIndex: number): Generator<Region> {
    if (length < 32) return;
    yield {
        id: `ext.${extIndex}.closeAuthority@${start}`,
        name: 'MintCloseAuthority — Close Authority',
        start,
        length: 32,
        kind: 'authority',
        decodedValue: decodeOptionalNonZeroPubkey(raw, start),
    };
}

function* decodePermanentDelegate(raw: Uint8Array, start: number, length: number, extIndex: number): Generator<Region> {
    if (length < 32) return;
    yield {
        id: `ext.${extIndex}.permanentDelegate@${start}`,
        name: 'PermanentDelegate — Delegate',
        start,
        length: 32,
        kind: 'authority',
        decodedValue: decodeOptionalNonZeroPubkey(raw, start),
    };
}

function* decodeMetadataPointer(raw: Uint8Array, start: number, length: number, extIndex: number): Generator<Region> {
    if (length < 64) return;
    yield {
        id: `ext.${extIndex}.metadataPointer.authority@${start}`,
        name: 'MetadataPointer — Authority',
        start,
        length: 32,
        kind: 'authority',
        decodedValue: decodeOptionalNonZeroPubkey(raw, start),
    };
    yield {
        id: `ext.${extIndex}.metadataPointer.address@${start + 32}`,
        name: 'MetadataPointer — Metadata Address',
        start: start + 32,
        length: 32,
        kind: 'pubkey',
        decodedValue: decodeOptionalNonZeroPubkey(raw, start + 32),
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
        id: `ext.${extIndex}.ibc.rateAuthority@${start}`,
        name: 'InterestBearing — Rate Authority',
        start,
        length: 32,
        kind: 'authority',
        decodedValue: decodeOptionalNonZeroPubkey(raw, start),
    };
    yield {
        id: `ext.${extIndex}.ibc.initTs@${start + 32}`,
        name: 'InterestBearing — Initialization Timestamp',
        start: start + 32,
        length: 8,
        kind: 'scalar',
        decodedValue: { kind: 'text', value: view.getBigInt64(start + 32, true).toString() },
    };
    yield {
        id: `ext.${extIndex}.ibc.preRate@${start + 40}`,
        name: 'InterestBearing — Pre-update Average Rate',
        start: start + 40,
        length: 2,
        kind: 'scalar',
        decodedValue: { kind: 'text', value: `${view.getInt16(start + 40, true)} bps` },
    };
    yield {
        id: `ext.${extIndex}.ibc.lastTs@${start + 42}`,
        name: 'InterestBearing — Last Update Timestamp',
        start: start + 42,
        length: 8,
        kind: 'scalar',
        decodedValue: { kind: 'text', value: view.getBigInt64(start + 42, true).toString() },
    };
    yield {
        id: `ext.${extIndex}.ibc.currentRate@${start + 50}`,
        name: 'InterestBearing — Current Rate',
        start: start + 50,
        length: 2,
        kind: 'scalar',
        decodedValue: { kind: 'text', value: `${view.getInt16(start + 50, true)} bps` },
    };
}

/**
 * TokenMetadata layout (TLV-internal):
 *   0..32   update_authority (OptionalNonZeroPubkey)
 *   32..64  mint             (Pubkey)
 *   64..    borsh String:    name    (u32 LE length + UTF-8 bytes)
 *   ...     borsh String:    symbol
 *   ...     borsh String:    uri
 *   ...     u32 additional_metadata length + (string key, string value) * N
 *
 * Strings are sanitized via sanitizeDisplayString: C0/C1 stripped, bidi overrides
 * neutralized, truncated to MAX_DISPLAY_STRING. URI is NEVER rendered as a link.
 */
function* decodeTokenMetadata(
    raw: Uint8Array,
    start: number,
    length: number,
    extIndex: number,
): Generator<Region> {
    const end = start + length;
    if (length < 64 + 4) return; // minimum: 64 pubkeys + 4-byte length prefix for name
    yield {
        id: `ext.${extIndex}.tm.updateAuthority@${start}`,
        name: 'TokenMetadata — Update Authority',
        start,
        length: 32,
        kind: 'authority',
        decodedValue: decodeOptionalNonZeroPubkey(raw, start),
    };
    yield {
        id: `ext.${extIndex}.tm.mint@${start + 32}`,
        name: 'TokenMetadata — Mint',
        start: start + 32,
        length: 32,
        kind: 'pubkey',
        decodedValue: { kind: 'pubkey', base58: bs58.encode(raw.slice(start + 32, start + 64)) },
    };

    let pos = start + 64;
    for (const fieldName of ['Name', 'Symbol', 'URI'] as const) {
        if (pos + 4 > end) return;
        const strLen = readUint32LE(raw, pos);
        if (pos + 4 + strLen > end) {
            yield {
                id: `ext.${extIndex}.tm.${fieldName.toLowerCase()}.truncated@${pos}`,
                name: `TokenMetadata — ${fieldName} (truncated)`,
                start: pos,
                length: end - pos,
                kind: 'neutral',
                decodedValue: { kind: 'unparsed', reason: 'truncated' },
            };
            return;
        }
        const bytes = raw.slice(pos + 4, pos + 4 + strLen);
        const rawText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
        const safeText = sanitizeDisplayString(rawText);
        yield {
            id: `ext.${extIndex}.tm.${fieldName.toLowerCase()}@${pos}`,
            name: `TokenMetadata — ${fieldName}`,
            start: pos,
            length: 4 + strLen,
            kind: 'neutral',
            decodedValue: { kind: 'text', value: safeText },
        };
        pos += 4 + strLen;
    }
    // Any trailing bytes (additional_metadata length + entries) rendered as one opaque region.
    if (pos < end) {
        yield {
            id: `ext.${extIndex}.tm.additional@${pos}`,
            name: 'TokenMetadata — Additional Metadata',
            start: pos,
            length: end - pos,
            kind: 'neutral',
            decodedValue: { kind: 'text', value: `${end - pos} byte(s)` },
        };
    }
}

const EXTENSION_DECODERS: Partial<Record<number, ExtensionDecoder>> = {
    3: decodeMintCloseAuthority,
    10: decodeInterestBearingConfig,
    12: decodePermanentDelegate,
    18: decodeMetadataPointer,
    19: decodeTokenMetadata,
};
