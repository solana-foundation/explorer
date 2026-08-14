import {
    type CompiledTransactionMessage,
    type CompiledTransactionMessageWithLifetime,
    getBase58Decoder,
    getCompiledTransactionMessageDecoder,
    getTransactionDecoder,
} from '@solana/kit';

export type WireTransaction = {
    compiledMessage: CompiledTransactionMessage & CompiledTransactionMessageWithLifetime;
    /** The message portion of the wire bytes, exactly as served by the RPC. */
    messageBytes: Uint8Array;
    /** Base58-encoded in signer order; a signer slot that has not been signed is `undefined`. */
    signatures: (string | undefined)[];
};

/**
 * Splits base64-encoded transaction wire bytes into their message and signatures.
 *
 * kit is used rather than web3.js `VersionedTransaction` because v1 reorders the wire envelope —
 * message bytes first, then a fixed-count signature array with no length prefix — which web3.js
 * cannot parse.
 */
export function decodeWireTransaction(bytes: Uint8Array): WireTransaction {
    const transaction = getTransactionDecoder().decode(bytes);
    const base58Decoder = getBase58Decoder();

    return {
        compiledMessage: getCompiledTransactionMessageDecoder().decode(transaction.messageBytes),
        // The decoded message bytes are a view over `bytes`; copy so callers own their buffer.
        messageBytes: new Uint8Array(transaction.messageBytes),
        // SignaturesMap is insertion-ordered, matching the message's signer order. A signer slot
        // that has not been signed holds no bytes at all, which consumers render as missing rather
        // than as a signature that fails to verify.
        signatures: Object.values(transaction.signatures).map(signature =>
            signature ? base58Decoder.decode(signature) : undefined,
        ),
    };
}
