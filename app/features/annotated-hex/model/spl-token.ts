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
