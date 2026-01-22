import bs58 from 'bs58';

import { type ByteArray, toBase64, toHex } from '@/app/shared/lib/bytes';

export type EncodingFormat = 'hex' | 'base58' | 'base64';

interface EncodingProvider {
    encode(data: ByteArray): string;
}

const hexProvider: EncodingProvider = {
    encode: toHex,
};

const base58Provider: EncodingProvider = {
    encode: data => bs58.encode(data),
};

const base64Provider: EncodingProvider = {
    encode: toBase64,
};

const providers: Record<EncodingFormat, EncodingProvider> = {
    base58: base58Provider,
    base64: base64Provider,
    hex: hexProvider,
};

export function encodeTransactionData(data: ByteArray, format: EncodingFormat): string {
    if (!(data instanceof Uint8Array)) {
        throw new Error('encodeTransactionData expects Uint8Array or Buffer');
    }
    return providers[format].encode(data);
}
