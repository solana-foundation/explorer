import bs58 from 'bs58';

import { readU64LE, readUint32LE } from '@/app/shared/lib/bytes';

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
    return SPL_MINT_LAYOUT.map(field => ({
        ...field,
        decodedValue: decodeMintField(field.id, raw, parsed),
    }));
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
    return SPL_TOKEN_ACCOUNT_LAYOUT.map(field => ({
        ...field,
        decodedValue: decodeTokenAccountField(field.id, raw, parsed),
    }));
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
