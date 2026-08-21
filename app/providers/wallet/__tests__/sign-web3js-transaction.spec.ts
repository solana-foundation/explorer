import {
    generateKeyPairSigner,
    getTransactionCodec,
    type ReadonlyUint8Array,
    type SignatureBytes,
    signatureBytes,
    signBytes,
    type Transaction as KitTransaction,
    verifySignature,
} from '@solana/kit';
import type { WalletSigner } from '@solana/kit-plugin-wallet';
import {
    PublicKey,
    Transaction,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
} from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { signWeb3jsTransaction, signWeb3jsTransactions } from '../sign-web3js-transaction';

const { address: signerAddress, keyPair } = await generateKeyPairSigner();
const signerPublicKey = new PublicKey(signerAddress);
const blockhash = PublicKey.default.toBase58();
const transactionCodec = getTransactionCodec();

/** Payload of the instruction a modifying wallet fake prepends, used to spot it after the round trip. */
const WALLET_ADDED_DATA = Uint8Array.from([9, 8, 7]);

function makeInstruction(data: Uint8Array = Uint8Array.from([1])): TransactionInstruction {
    return new TransactionInstruction({ data: Buffer.from(data), keys: [], programId: PublicKey.default });
}

function makeLegacyTransaction(): Transaction {
    const transaction = new Transaction();
    transaction.feePayer = signerPublicKey;
    transaction.recentBlockhash = blockhash;
    transaction.add(makeInstruction());
    return transaction;
}

function makeVersionedTransaction(): VersionedTransaction {
    const message = new TransactionMessage({
        instructions: [makeInstruction()],
        payerKey: signerPublicKey,
        recentBlockhash: blockhash,
    }).compileToV0Message();
    return new VersionedTransaction(message);
}

function sign(messageBytes: ReadonlyUint8Array): Promise<SignatureBytes> {
    return signBytes(keyPair.privateKey, messageBytes);
}

async function attachSignature(transaction: KitTransaction): Promise<KitTransaction> {
    return {
        ...transaction,
        signatures: { ...transaction.signatures, [signerAddress]: await sign(transaction.messageBytes) },
    };
}

/**
 * Rebuilds a transaction with an extra leading instruction, standing in for a wallet that exercises
 * its `solana:signTransaction` freedom to alter the message it was handed. The rebuilt message is
 * what gets signed, so a signature copied back onto the original transaction would not verify.
 */
function prependWalletInstruction(transaction: KitTransaction): KitTransaction {
    const decoded = Transaction.from(new Uint8Array(transactionCodec.encode(transaction)));
    const modified = new Transaction();
    modified.feePayer = decoded.feePayer;
    modified.recentBlockhash = decoded.recentBlockhash;
    modified.add(makeInstruction(WALLET_ADDED_DATA), ...decoded.instructions);
    return transactionCodec.decode(
        new Uint8Array(modified.serialize({ requireAllSignatures: false, verifySignatures: false })),
    );
}

const modifyingSigner = {
    address: signerAddress,
    modifyAndSignTransactions: (transactions: readonly KitTransaction[]) =>
        Promise.all(transactions.map(transaction => attachSignature(prependWalletInstruction(transaction)))),
} as unknown as WalletSigner;

const signOnlySigner = {
    address: signerAddress,
    modifyAndSignTransactions: (transactions: readonly KitTransaction[]) =>
        Promise.all(transactions.map(attachSignature)),
} as unknown as WalletSigner;

const sendingOnlySigner = {
    address: signerAddress,
    signAndSendTransactions: () => Promise.resolve([]),
} as unknown as WalletSigner;

describe('signWeb3jsTransaction', () => {
    it('should return a verifiably signed legacy transaction', async () => {
        const signed = await signWeb3jsTransaction(signOnlySigner, makeLegacyTransaction());

        expect(signed).toBeInstanceOf(Transaction);
        expect(signed.verifySignatures()).toBe(true);
        expect(signed.signatures[0]?.publicKey.equals(signerPublicKey)).toBe(true);
        // The execution path broadcasts `signed.serialize()`, which throws unless every required
        // signature is present.
        expect(() => signed.serialize()).not.toThrow();
    });

    it('should keep a modifying wallet’s changes to the legacy message', async () => {
        const signed = await signWeb3jsTransaction(modifyingSigner, makeLegacyTransaction());

        const [added] = signed.instructions;

        expect(signed.instructions).toHaveLength(2);
        expect(added && Uint8Array.from(added.data)).toEqual(WALLET_ADDED_DATA);
        // The returned transaction carries the message the wallet signed, not the one it was handed,
        // so the signature covers the added instruction.
        expect(signed.verifySignatures()).toBe(true);
        expect(() => signed.serialize()).not.toThrow();
    });

    it('should return a signed versioned transaction, keeping it versioned', async () => {
        const signed = await signWeb3jsTransaction(signOnlySigner, makeVersionedTransaction());

        const [signature = new Uint8Array()] = signed.signatures;

        expect(signed).toBeInstanceOf(VersionedTransaction);
        expect(await verifySignature(keyPair.publicKey, signatureBytes(signature), signed.message.serialize())).toBe(
            true,
        );
    });

    it('should throw for a wallet that can only sign and send', async () => {
        await expect(signWeb3jsTransaction(sendingOnlySigner, makeLegacyTransaction())).rejects.toThrow(
            'only sign and send transactions itself',
        );
    });
});

describe('signWeb3jsTransactions', () => {
    it('should sign every transaction in one wallet round trip', async () => {
        const signed = await signWeb3jsTransactions(modifyingSigner, [
            makeLegacyTransaction(),
            makeLegacyTransaction(),
        ]);

        expect(signed).toHaveLength(2);
        expect(signed.every(transaction => transaction.verifySignatures())).toBe(true);
        expect(signed.every(transaction => transaction.instructions.length === 2)).toBe(true);
    });

    it('should return an empty list without prompting the wallet', async () => {
        await expect(signWeb3jsTransactions(sendingOnlySigner, [])).resolves.toEqual([]);
    });
});
