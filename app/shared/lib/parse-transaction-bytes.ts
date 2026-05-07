import {
    bytesEqual,
    getBase58Decoder,
    getCompiledTransactionMessageDecoder,
    getCompiledTransactionMessageEncoder,
    getTransactionDecoder,
} from '@solana/kit';

/** Minimum byte length for a valid Solana transaction message. */
export const MIN_MESSAGE_LENGTH =
    3 + // header
    1 + // accounts length
    32 + // accounts, must have at least one address for fees
    32 + // recent blockhash
    1; // instructions length

const TRANSACTION_DECODER = getTransactionDecoder();
const MESSAGE_DECODER = getCompiledTransactionMessageDecoder();
const MESSAGE_ENCODER = getCompiledTransactionMessageEncoder();
const BASE58_DECODER = getBase58Decoder();

/**
 * Determines whether `bytes` is a full transaction (signatures + message) or a
 * bare message, and returns the message portion either way.
 *
 * Tries to decode as a wire-format transaction first. If that fails (e.g. the
 * input is a bare message with no signatures), falls back to treating the
 * entire input as a raw message.
 *
 * Returns `signatures` only when the input is a full transaction.
 */
export function parseTransactionBytes(bytes: Uint8Array): {
    messageBytes: Uint8Array;
    signatures?: (string | undefined)[];
} {
    let tx;
    try {
        tx = TRANSACTION_DECODER.decode(bytes);
    } catch {
        return { messageBytes: bytes };
    }

    // A bare message can accidentally decode as a transaction when its first
    // byte is a plausible compact-u16 signature count and the bytes that
    // follow happen to satisfy the message header self-check. Re-encoding the
    // *message* canonically catches this: an accidental match carries trailing
    // junk that gets dropped on re-encode, while a real transaction's message
    // is canonical and round-trips byte-for-byte.
    let reEncodedMessage;
    try {
        reEncodedMessage = MESSAGE_ENCODER.encode(MESSAGE_DECODER.decode(tx.messageBytes));
    } catch {
        return { messageBytes: bytes };
    }
    if (!bytesEqual(reEncodedMessage, tx.messageBytes)) {
        return { messageBytes: bytes };
    }

    // tx.messageBytes is a view over the input — copy so callers can mutate
    // their input buffer without affecting our return value.
    const messageBytes = new Uint8Array(tx.messageBytes);
    // SignaturesMap is insertion-ordered, matching message signer order.
    const signatures = Object.values(tx.signatures).map(sig => (sig ? BASE58_DECODER.decode(sig) : undefined));
    const hasSignatures = signatures.some(Boolean);
    return {
        messageBytes,
        ...(hasSignatures ? { signatures } : undefined),
    };
}
