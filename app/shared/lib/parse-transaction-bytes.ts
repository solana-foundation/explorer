import { VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

/** Minimum byte length for a valid Solana transaction message. */
export const MIN_MESSAGE_LENGTH =
    3 + // header
    1 + // accounts length
    32 + // accounts, must have at least one address for fees
    32 + // recent blockhash
    1; // instructions length

/**
 * Determines whether `bytes` is a full transaction (signatures + message) or a
 * bare message, and returns the message portion either way.
 *
 * Tries `VersionedTransaction.deserialize` first. If that fails (e.g. the input
 * is a bare message with no signatures), falls back to treating the entire input
 * as a raw message.
 *
 * Returns `signatures` only when the input is a full transaction.
 */
export function parseTransactionBytes(bytes: Uint8Array): {
    messageBytes: Uint8Array;
    signatures?: (string | undefined)[];
} {
    try {
        const tx = VersionedTransaction.deserialize(bytes);
        const messageBytes = new Uint8Array(tx.message.serialize());
        const signatures = tx.signatures.map(sig => (sig.some(b => b !== 0) ? bs58.encode(sig) : undefined));
        const hasSignatures = signatures.some(Boolean);
        return {
            messageBytes,
            ...(hasSignatures ? { signatures } : undefined),
        };
    } catch {
        // Deserialization as a transaction failed — treat the entire input as a bare message.
        return { messageBytes: bytes };
    }
}
