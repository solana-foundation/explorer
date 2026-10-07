import { type CompiledTransactionMessage, getCompiledTransactionMessageDecoder, getShortU16Encoder } from '@solana/kit';

import type { ParsedTransaction } from './types.js';
import { isV1MessageBytes } from './version.js';

export const LEGACY_TRANSACTION_SIZE_LIMIT = 1232;
export const V1_TRANSACTION_SIZE_LIMIT = 4096;

const SIGNATURE_BYTES = 64;

/**
 * kit's `getTransactionSizeLimit` accepts only a kit `Transaction`.
 * Callers hold a parsed transaction, a compiled message or message bytes, so this function accepts all three.
 */
export function transactionSizeLimit(source: ParsedTransaction | CompiledTransactionMessage | Uint8Array): number {
    return isV1(source) ? V1_TRANSACTION_SIZE_LIMIT : LEGACY_TRANSACTION_SIZE_LIMIT;
}

/** The v1 envelope carries no signature-count prefix: the count is read from the message header instead. */
export function transactionWireSize(messageBytes: Uint8Array): number {
    const compiled = getCompiledTransactionMessageDecoder().decode(messageBytes);
    const numSignatures = compiled.header.numSignerAccounts;
    const signatureCountPrefix = compiled.version === 1 ? 0 : getShortU16Encoder().getSizeFromValue(numSignatures);

    return signatureCountPrefix + SIGNATURE_BYTES * numSignatures + messageBytes.length;
}

function isV1(source: ParsedTransaction | CompiledTransactionMessage | Uint8Array): boolean {
    if (source instanceof Uint8Array) return isV1MessageBytes(source);
    return source.version === 1;
}
