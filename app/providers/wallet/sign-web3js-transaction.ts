import { getTransactionCodec, isTransactionModifyingSigner } from '@solana/kit';
import type { WalletSigner } from '@solana/kit-plugin-wallet';
import { Transaction, VersionedTransaction } from '@solana/web3.js';

const SIGN_AND_SEND_ONLY_MESSAGE =
    'This wallet can only sign and send transactions itself, which Explorer does not support here. Use a wallet that supports transaction signing.';

export type Web3Transaction = Transaction | VersionedTransaction;

const transactionCodec = getTransactionCodec();

function toWireBytes(transaction: Web3Transaction): Uint8Array {
    if (transaction instanceof VersionedTransaction) {
        return transaction.serialize();
    }
    return new Uint8Array(transaction.serialize({ requireAllSignatures: false, verifySignatures: false }));
}

function fromWireBytes<T extends Web3Transaction>(original: T, bytes: Uint8Array): T {
    const decoded =
        original instanceof VersionedTransaction ? VersionedTransaction.deserialize(bytes) : Transaction.from(bytes);
    return decoded as T;
}

/**
 * Signs web3.js transactions with a Kit wallet signer.
 *
 * Both sides are converted through the transaction wire format rather than field by field: it is
 * the one representation web3.js and Kit already agree on, and it carries legacy and versioned
 * transactions alike. Signature slots survive the trip because Kit decodes a zero-filled signature
 * as an unsigned slot, which is exactly how web3.js serializes one.
 *
 * The result is rebuilt from the bytes the wallet returned rather than by copying a signature onto
 * the transaction that was passed in. Wallets implementing `solana:signTransaction` surface as
 * modifying signers and are free to alter the message they were handed, in which case a signature
 * copied back onto the original would not cover what gets broadcast.
 *
 * @throws If the wallet only exposes `solana:signAndSendTransaction`, since Explorer broadcasts
 *   through its own RPC connection and needs the signed transaction back.
 */
export async function signWeb3jsTransactions<T extends Web3Transaction>(
    signer: WalletSigner,
    transactions: T[],
): Promise<T[]> {
    if (transactions.length === 0) return [];

    if (!isTransactionModifyingSigner(signer)) {
        throw new Error(SIGN_AND_SEND_ONLY_MESSAGE);
    }

    const unsigned = transactions.map(transaction => transactionCodec.decode(toWireBytes(transaction)));
    const signed = await signer.modifyAndSignTransactions(unsigned);

    return transactions.map((original, index) => {
        const signedTransaction = signed[index];
        if (!signedTransaction) {
            throw new Error('Wallet returned fewer signed transactions than were requested');
        }
        return fromWireBytes(original, new Uint8Array(transactionCodec.encode(signedTransaction)));
    });
}

export async function signWeb3jsTransaction<T extends Web3Transaction>(
    signer: WalletSigner,
    transaction: T,
): Promise<T> {
    const [signed] = await signWeb3jsTransactions(signer, [transaction]);
    if (!signed) {
        throw new Error('Wallet returned no signed transaction');
    }
    return signed;
}
