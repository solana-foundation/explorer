import { address, type ReadonlyUint8Array, type SignatureBytes, type Transaction as KitTransaction } from '@solana/kit';
import type { WalletSigner } from '@solana/kit-plugin-wallet';
import {
    Keypair,
    PublicKey,
    Transaction,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
} from '@solana/web3.js';
import nacl from 'tweetnacl';
import { describe, expect, it } from 'vitest';

import { signWeb3jsTransaction, signWeb3jsTransactions } from '../sign-web3js-transaction';

const keypair = Keypair.generate();
const signerAddress = address(keypair.publicKey.toBase58());
const blockhash = PublicKey.default.toBase58();

function makeInstruction(): TransactionInstruction {
    return new TransactionInstruction({ data: Buffer.from([1]), keys: [], programId: PublicKey.default });
}

function makeLegacyTransaction(): Transaction {
    const transaction = new Transaction();
    transaction.feePayer = keypair.publicKey;
    transaction.recentBlockhash = blockhash;
    transaction.add(makeInstruction());
    return transaction;
}

function makeVersionedTransaction(): VersionedTransaction {
    const message = new TransactionMessage({
        instructions: [makeInstruction()],
        payerKey: keypair.publicKey,
        recentBlockhash: blockhash,
    }).compileToV0Message();
    return new VersionedTransaction(message);
}

function sign(messageBytes: ReadonlyUint8Array): SignatureBytes {
    return nacl.sign.detached(new Uint8Array(messageBytes), keypair.secretKey) as SignatureBytes;
}

const modifyingSigner = {
    address: signerAddress,
    modifyAndSignTransactions: (transactions: readonly KitTransaction[]) =>
        Promise.resolve(
            transactions.map(transaction => ({
                ...transaction,
                signatures: { ...transaction.signatures, [signerAddress]: sign(transaction.messageBytes) },
            })),
        ),
} as unknown as WalletSigner;

const sendingOnlySigner = {
    address: signerAddress,
    signAndSendTransactions: () => Promise.resolve([]),
} as unknown as WalletSigner;

describe('signWeb3jsTransaction', () => {
    it('should return a verifiably signed legacy transaction', async () => {
        const signed = await signWeb3jsTransaction(modifyingSigner, makeLegacyTransaction());

        expect(signed).toBeInstanceOf(Transaction);
        expect(signed.verifySignatures()).toBe(true);
        expect(signed.signatures[0]?.publicKey.equals(keypair.publicKey)).toBe(true);
        // The execution path broadcasts `signed.serialize()`, which throws unless every required
        // signature is present.
        expect(() => signed.serialize()).not.toThrow();
    });

    it('should return a signed versioned transaction, keeping it versioned', async () => {
        const signed = await signWeb3jsTransaction(modifyingSigner, makeVersionedTransaction());

        const [signature = new Uint8Array()] = signed.signatures;

        expect(signed).toBeInstanceOf(VersionedTransaction);
        expect(nacl.sign.detached.verify(signed.message.serialize(), signature, keypair.publicKey.toBytes())).toBe(
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
    });

    it('should return an empty list without prompting the wallet', async () => {
        await expect(signWeb3jsTransactions(sendingOnlySigner, [])).resolves.toEqual([]);
    });
});
