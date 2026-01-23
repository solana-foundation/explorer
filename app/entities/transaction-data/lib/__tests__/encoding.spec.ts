import { Keypair, PublicKey, SystemProgram, TransactionMessage, VersionedMessage } from '@solana/web3.js';
import bs58 from 'bs58';
import { describe, expect, it } from 'vitest';

import { encodeTransactionData } from '../encoding';

// Note: Buffer is used in tests for decoding since tests run in Node.js environment.
// The production code uses only Uint8Array for browser compatibility.

describe('transaction-data encoding', () => {
    const FROM_PUBKEY = Keypair.generate().publicKey;
    const TO_PUBKEY = Keypair.generate().publicKey;
    const TRANSFER_AMOUNT = 1_000_000n;

    const createTransferInstruction = () =>
        SystemProgram.transfer({
            fromPubkey: FROM_PUBKEY,
            lamports: TRANSFER_AMOUNT,
            toPubkey: TO_PUBKEY,
        });

    const createLegacyMessage = (): Uint8Array => {
        const message = new TransactionMessage({
            instructions: [createTransferInstruction()],
            payerKey: FROM_PUBKEY,
            recentBlockhash: PublicKey.default.toBase58(),
        }).compileToLegacyMessage();

        return message.serialize();
    };

    const createV0Message = (): Uint8Array => {
        const message = new TransactionMessage({
            instructions: [createTransferInstruction()],
            payerKey: FROM_PUBKEY,
            recentBlockhash: PublicKey.default.toBase58(),
        }).compileToV0Message();

        return message.serialize();
    };

    const verifyDecodedMessage = (decoded: Uint8Array) => {
        const message = VersionedMessage.deserialize(decoded);

        // Verify header
        expect(message.header.numRequiredSignatures).toBe(1);

        // Verify accounts
        const accountKeys = message.staticAccountKeys;
        expect(accountKeys.some(key => key.equals(FROM_PUBKEY))).toBe(true);
        expect(accountKeys.some(key => key.equals(TO_PUBKEY))).toBe(true);
        expect(accountKeys.some(key => key.equals(SystemProgram.programId))).toBe(true);

        // Verify transfer instruction
        expect(message.compiledInstructions.length).toBe(1);
        const instruction = message.compiledInstructions[0];

        // Verify program is System Program
        const programId = accountKeys[instruction.programIdIndex];
        expect(programId.equals(SystemProgram.programId)).toBe(true);

        // Verify from/to accounts
        const fromAccount = accountKeys[instruction.accountKeyIndexes[0]];
        const toAccount = accountKeys[instruction.accountKeyIndexes[1]];
        expect(fromAccount.equals(FROM_PUBKEY)).toBe(true);
        expect(toAccount.equals(TO_PUBKEY)).toBe(true);

        // Verify transfer instruction data: [4 bytes type (2=transfer)] [8 bytes lamports LE]
        const dataView = new DataView(instruction.data.buffer, instruction.data.byteOffset);
        const instructionType = dataView.getUint32(0, true);
        const lamports = dataView.getBigUint64(4, true);
        expect(instructionType).toBe(2); // Transfer
        expect(lamports).toBe(TRANSFER_AMOUNT);
    };

    const messageVariants = [
        { create: createLegacyMessage, name: 'legacy' },
        { create: createV0Message, name: 'v0' },
    ];

    const inputVariants = [
        { convert: (data: Uint8Array) => data, name: 'Uint8Array' },
        { convert: (data: Uint8Array) => Buffer.from(data), name: 'Buffer' },
    ];

    describe('hex encoding', () => {
        messageVariants.forEach(({ name: msgName, create }) => {
            inputVariants.forEach(({ name: inputName, convert }) => {
                it(`should encode ${msgName} message from ${inputName} correctly`, () => {
                    const original = convert(create());
                    const encoded = encodeTransactionData(original, 'hex');
                    const decoded = Buffer.from(encoded, 'hex');
                    verifyDecodedMessage(decoded);
                });
            });
        });
    });

    describe('base58 encoding', () => {
        messageVariants.forEach(({ name: msgName, create }) => {
            inputVariants.forEach(({ name: inputName, convert }) => {
                it(`should encode ${msgName} message from ${inputName} correctly`, () => {
                    const original = convert(create());
                    const encoded = encodeTransactionData(original, 'base58');
                    const decoded = bs58.decode(encoded);
                    verifyDecodedMessage(decoded);
                });
            });
        });
    });

    describe('base64 encoding', () => {
        messageVariants.forEach(({ name: msgName, create }) => {
            inputVariants.forEach(({ name: inputName, convert }) => {
                it(`should encode ${msgName} message from ${inputName} correctly`, () => {
                    const original = convert(create());
                    const encoded = encodeTransactionData(original, 'base64');
                    const decoded = Buffer.from(encoded, 'base64');
                    verifyDecodedMessage(decoded);
                });
            });
        });
    });

    describe('invariant', () => {
        it('should throw if data is not Uint8Array or Buffer', () => {
            const invalidData = 'not a Uint8Array';
            expect(() => encodeTransactionData(invalidData as unknown as Uint8Array, 'hex')).toThrow(
                'encodeTransactionData expects Uint8Array or Buffer'
            );
        });

        it('should accept Buffer (Buffer extends Uint8Array)', () => {
            const data = Buffer.from([1, 2, 3]);
            expect(data instanceof Uint8Array).toBe(true);
            expect(() => encodeTransactionData(data, 'hex')).not.toThrow();
        });
    });
});
