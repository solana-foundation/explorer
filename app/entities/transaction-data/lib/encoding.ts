import { getBase58Decoder, type ReadonlyUint8Array } from '@solana/kit';

import { toBase64, toHex } from '@/app/shared/lib/bytes';

const BASE58_DECODER = getBase58Decoder();

export type EncodingFormat = 'hex' | 'base58' | 'base64';

interface EncodingProvider {
    encode(data: ReadonlyUint8Array): string;
}

const hexProvider: EncodingProvider = {
    encode: toHex,
};

const base58Provider: EncodingProvider = {
    encode: data => BASE58_DECODER.decode(data),
};

const base64Provider: EncodingProvider = {
    encode: toBase64,
};

const providers: Record<EncodingFormat, EncodingProvider> = {
    base58: base58Provider,
    base64: base64Provider,
    hex: hexProvider,
};

export function encodeTransactionData(data: ReadonlyUint8Array, format: EncodingFormat): string {
    if (!(data instanceof Uint8Array)) {
        throw new Error('encodeTransactionData expects Uint8Array or Buffer');
    }
    return providers[format].encode(data);
}
