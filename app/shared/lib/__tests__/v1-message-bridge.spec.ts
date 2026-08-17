import { getTransactionDecoder } from '@solana/kit';
import { PublicKey, VersionedMessage } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import {
    createV1TransactionBytes,
    createWeb3TransactionBytes,
    FEE_PAYER,
    RECIPIENT,
} from '@/app/entities/transaction-data/__fixtures__/wire-transactions';

import { parseTransactionBytes } from '../parse-transaction-bytes';
import { bridgeV1MessageBytes, isV1MessageBytes, UnsignedV1WireTransaction, V1MessageView } from '../v1-message-bridge';

function v1MessageBytes(config: Parameters<typeof createV1TransactionBytes>[0] = {}): Uint8Array {
    return parseTransactionBytes(createV1TransactionBytes(config)).messageBytes;
}

describe('isV1MessageBytes', () => {
    it('should identify v1 message bytes', () => {
        expect(isV1MessageBytes(v1MessageBytes())).toBe(true);
    });

    it.each([['legacy'], [0]] as const)('should reject %s message bytes', version => {
        const { messageBytes } = parseTransactionBytes(createWeb3TransactionBytes(version));
        expect(isV1MessageBytes(messageBytes)).toBe(false);
    });

    it('should reject empty input', () => {
        expect(isV1MessageBytes(new Uint8Array(0))).toBe(false);
    });
});

describe('bridgeV1MessageBytes', () => {
    it('should map the compiled message onto the web3.js view', () => {
        const { message } = bridgeV1MessageBytes(v1MessageBytes());

        // fee payer, recipient, then the instruction's program address
        expect(message.staticAccountKeys).toHaveLength(3);
        expect(message.staticAccountKeys.slice(0, 2).map(key => key.toBase58())).toEqual([FEE_PAYER, RECIPIENT]);
        expect(message.header.numRequiredSignatures).toBe(1);
        expect(message.addressTableLookups).toEqual([]);
        expect(message.compiledInstructions).toHaveLength(1);
        expect(message.compiledInstructions[0].data).toEqual(new Uint8Array([1]));
        expect(message.staticAccountKeys[0]).toBeInstanceOf(PublicKey);
    });

    it('should serialize back to the original v1 bytes, not a v0 re-encoding', () => {
        const messageBytes = v1MessageBytes({ computeUnitLimit: 300_000 });
        const { message } = bridgeV1MessageBytes(messageBytes);

        expect(message.serialize()).toEqual(messageBytes);
    });

    it('should produce a message-first unsigned v1 wire transaction', () => {
        const messageBytes = v1MessageBytes({ computeUnitLimit: 300_000 });
        const { message } = bridgeV1MessageBytes(messageBytes);

        const wireBytes = new UnsignedV1WireTransaction(message).serialize();

        // The v1 envelope is [message][signatures] with no count prefix: nodes route on the
        // version-flagged first byte, so anything else is rejected as an invalid message version.
        expect(wireBytes[0]).toBe(0x81);
        expect(wireBytes.slice(0, messageBytes.length)).toEqual(messageBytes);
        expect(wireBytes).toHaveLength(messageBytes.length + 64);
        expect(wireBytes.slice(messageBytes.length)).toEqual(new Uint8Array(64));

        const decoded = getTransactionDecoder().decode(wireBytes);
        expect(new Uint8Array(decoded.messageBytes)).toEqual(messageBytes);
        expect(Object.values(decoded.signatures)).toHaveLength(1);
    });

    it('should match the wire bytes kit itself encodes for the same unsigned transaction', () => {
        const fixtureWireBytes = createV1TransactionBytes({ computeUnitLimit: 300_000 });
        const { messageBytes } = parseTransactionBytes(fixtureWireBytes);
        const { message } = bridgeV1MessageBytes(messageBytes);

        expect(new UnsignedV1WireTransaction(message).serialize()).toEqual(fixtureWireBytes);
    });

    it('should extract the resource limits the message sets', () => {
        const { transactionConfig } = bridgeV1MessageBytes(
            v1MessageBytes({ computeUnitLimit: 300_000, priorityFeeLamports: 50n }),
        );

        expect(transactionConfig).toEqual({ computeUnitLimit: 300_000, priorityFeeLamports: 50n });
    });

    it('should return no config when the message sets no limits', () => {
        expect(bridgeV1MessageBytes(v1MessageBytes()).transactionConfig).toBeUndefined();
    });

    it('should throw on non-v1 message bytes', () => {
        const { messageBytes } = parseTransactionBytes(createWeb3TransactionBytes(0));
        expect(() => bridgeV1MessageBytes(messageBytes)).toThrow();
    });

    it('should throw on a full v1 wire transaction rather than treating the signatures as message bytes', () => {
        expect(() => bridgeV1MessageBytes(createV1TransactionBytes({}))).toThrow();
    });

    it('should throw on message bytes with trailing junk', () => {
        const messageBytes = v1MessageBytes();
        const padded = new Uint8Array(messageBytes.length + 3);
        padded.set(messageBytes);

        expect(() => bridgeV1MessageBytes(padded)).toThrow();
    });

    it('should return a V1MessageView so the true bytes survive any serialize call', () => {
        const { message } = bridgeV1MessageBytes(v1MessageBytes());
        expect(message).toBeInstanceOf(V1MessageView);
    });
});

describe('web3.js v1 behavior the bridge exists for', () => {
    it('should throw from VersionedMessage.deserialize on v1 bytes', () => {
        expect(() => VersionedMessage.deserialize(v1MessageBytes())).toThrow();
    });
});
