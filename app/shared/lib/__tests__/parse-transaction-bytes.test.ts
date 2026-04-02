import {
    Keypair,
    PublicKey,
    SystemProgram,
    TransactionMessage,
    VersionedMessage,
    VersionedTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import { describe, expect, it } from 'vitest';

import { parseTransactionBytes } from '../parse-transaction-bytes';

describe('parseTransactionBytes', () => {
    it.each([
        ['legacy', createLegacyMessageBytes],
        ['v0', createV0MessageBytes],
    ])('should treat raw %s message bytes as message-only (no signatures)', (_label, create) => {
        const messageBytes = create();
        const result = parseTransactionBytes(messageBytes);

        expect(result.signatures).toBeUndefined();
        expect(VersionedMessage.deserialize(result.messageBytes).header.numRequiredSignatures).toBe(1);
    });

    it.each([
        ['legacy', createLegacyMessageBytes],
        ['v0', createV0MessageBytes],
    ])('should extract signatures and valid message from a %s transaction', (_label, create) => {
        const messageBytes = create();
        const txBytes = buildTransactionBytes(messageBytes, 1);

        const result = parseTransactionBytes(txBytes);

        expect(result.signatures).toHaveLength(1);
        if (!result.signatures?.[0]) {
            throw new Error('Expected at least one signature');
        }
        // 64-byte ed25519 signature roundtrips through base58
        expect(bs58.decode(result.signatures[0])).toHaveLength(64);
        expect(VersionedMessage.deserialize(result.messageBytes).header.numRequiredSignatures).toBe(1);
    });

    it('should handle transactions with multiple signatures', () => {
        const messageBytes = createMultiSigMessageBytes();
        const numRequired = VersionedMessage.deserialize(messageBytes).header.numRequiredSignatures;
        const txBytes = buildTransactionBytes(messageBytes, numRequired);

        const result = parseTransactionBytes(txBytes);

        expect(result.signatures).toHaveLength(numRequired);
        expect(VersionedMessage.deserialize(result.messageBytes).header.numRequiredSignatures).toBe(numRequired);
    });

    it('should produce base58 signatures that roundtrip to the original bytes', () => {
        const messageBytes = createLegacyMessageBytes();
        const knownSigBytes = new Uint8Array(64).fill(42);
        const tx = new Uint8Array(1 + 64 + messageBytes.length);
        tx[0] = 1;
        tx.set(knownSigBytes, 1);
        tx.set(messageBytes, 65);

        const result = parseTransactionBytes(tx);

        if (!result.signatures) throw new Error('Expected signatures to be defined');
        expect(new Uint8Array(bs58.decode(result.signatures[0]))).toEqual(knownSigBytes);
    });

    it('should fall back when signature count mismatches message header', () => {
        const messageBytes = createLegacyMessageBytes();
        const fakeBytes = new Uint8Array(1 + messageBytes.length);
        fakeBytes[0] = 0;
        fakeBytes.set(messageBytes, 1);

        const result = parseTransactionBytes(fakeBytes);

        expect(result.signatures).toBeUndefined();
        expect(result.messageBytes).toBe(fakeBytes);
    });

    it('should fall back when bytes after signatures fail to deserialize', () => {
        const garbage = new Uint8Array(69);
        garbage[0] = 1; // claims 1 signature
        // requiredSignaturesByteOffset = 1 + 1*64 = 65
        garbage[65] = 1; // make numRequiredSignatures match so we enter the sig-parsing path

        const result = parseTransactionBytes(garbage);

        expect(result.signatures).toBeUndefined();
        expect(result.messageBytes).toBe(garbage);
    });

    it('should return a slice (not a view) of message bytes for transactions', () => {
        const txBytes = buildTransactionBytes(createLegacyMessageBytes(), 1);
        const result = parseTransactionBytes(txBytes);
        const snapshot = new Uint8Array(result.messageBytes);

        txBytes.fill(0);

        expect(result.messageBytes).toEqual(snapshot);
    });

    it.each([
        ['empty', new Uint8Array(0)],
        ['single zero byte', new Uint8Array([0])],
        ['single non-zero byte', new Uint8Array([1])],
        ['single max byte', new Uint8Array([255])],
        ['short buffer', new Uint8Array(10)],
    ])('should not throw for %s input', (_label, bytes) => {
        const result = parseTransactionBytes(bytes);

        expect(result.messageBytes).toBe(bytes);
        expect(result.signatures).toBeUndefined();
    });

    /**
     * VersionedTransaction.deserialize performs the same cross-check
     * (signature count must equal numRequiredSignatures), so the manual
     * implementation could safely be replaced by it.
     */

    it('should reject when sig count mismatches — same as VersionedTransaction.deserialize', () => {
        const innerMessage = createMultiSigMessageBytes();
        const numRequired = VersionedMessage.deserialize(innerMessage).header.numRequiredSignatures;
        expect(numRequired).toBe(2); // precondition: message needs 2 signers

        const ambiguousBytes = new Uint8Array(1 + 64 + innerMessage.length);
        ambiguousBytes[0] = 1; // claims 1 signature, but message needs 2
        ambiguousBytes.set(crypto.getRandomValues(new Uint8Array(64)), 1);
        ambiguousBytes.set(innerMessage, 65);

        // VersionedTransaction.deserialize also rejects the mismatch
        expect(() => VersionedTransaction.deserialize(ambiguousBytes)).toThrow(
            'Expected signatures length to be equal to the number of required signatures',
        );

        // parseTransactionBytes falls back to bare message
        const result = parseTransactionBytes(ambiguousBytes);
        expect(result.signatures).toBeUndefined();
        expect(result.messageBytes).toBe(ambiguousBytes);
    });

    it('should reject when sig count is zero but message requires signers — same as VersionedTransaction.deserialize', () => {
        const innerMessage = createLegacyMessageBytes();
        expect(VersionedMessage.deserialize(innerMessage).header.numRequiredSignatures).toBe(1);

        const ambiguousBytes = new Uint8Array(1 + innerMessage.length);
        ambiguousBytes[0] = 0; // claims 0 signatures, but message needs 1
        ambiguousBytes.set(innerMessage, 1);

        // VersionedTransaction.deserialize also rejects the mismatch
        expect(() => VersionedTransaction.deserialize(ambiguousBytes)).toThrow(
            'Expected signatures length to be equal to the number of required signatures',
        );

        // parseTransactionBytes falls back to bare message
        const result = parseTransactionBytes(ambiguousBytes);
        expect(result.signatures).toBeUndefined();
        expect(result.messageBytes).toBe(ambiguousBytes);
    });
});

const FROM_PUBKEY = Keypair.generate().publicKey;
const TO_PUBKEY = Keypair.generate().publicKey;

const createTransferInstruction = () =>
    SystemProgram.transfer({
        fromPubkey: FROM_PUBKEY,
        lamports: 1_000_000n,
        toPubkey: TO_PUBKEY,
    });

function createLegacyMessageBytes(): Uint8Array {
    const buf = new TransactionMessage({
        instructions: [createTransferInstruction()],
        payerKey: FROM_PUBKEY,
        recentBlockhash: PublicKey.default.toBase58(),
    })
        .compileToLegacyMessage()
        .serialize();
    return new Uint8Array(buf);
}

function createV0MessageBytes(): Uint8Array {
    const buf = new TransactionMessage({
        instructions: [createTransferInstruction()],
        payerKey: FROM_PUBKEY,
        recentBlockhash: PublicKey.default.toBase58(),
    })
        .compileToV0Message()
        .serialize();
    return new Uint8Array(buf);
}

function createMultiSigMessageBytes(): Uint8Array {
    const buf = new TransactionMessage({
        instructions: [
            SystemProgram.createAccount({
                fromPubkey: FROM_PUBKEY,
                lamports: 1_000_000,
                newAccountPubkey: Keypair.generate().publicKey,
                programId: SystemProgram.programId,
                space: 0,
            }),
        ],
        payerKey: FROM_PUBKEY,
        recentBlockhash: PublicKey.default.toBase58(),
    })
        .compileToLegacyMessage()
        .serialize();
    return new Uint8Array(buf);
}

function buildTransactionBytes(messageBytes: Uint8Array, signatureCount: number): Uint8Array {
    const signatures = Array.from({ length: signatureCount }, () => crypto.getRandomValues(new Uint8Array(64)));
    const tx = new Uint8Array(1 + signatureCount * 64 + messageBytes.length);
    tx[0] = signatureCount;
    for (let i = 0; i < signatureCount; i++) {
        tx.set(signatures[i], 1 + i * 64);
    }
    tx.set(messageBytes, 1 + signatureCount * 64);
    return tx;
}
