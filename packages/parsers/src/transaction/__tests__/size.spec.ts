import {
    type CompiledTransactionMessage,
    getTransactionEncoder,
    type SignatureBytes,
    type Transaction,
} from '@solana/kit';
import { describe, expect, it } from 'vitest';

import {
    LEGACY_TRANSACTION_SIZE_LIMIT,
    transactionSizeLimit,
    transactionWireSize,
    V1_TRANSACTION_SIZE_LIMIT,
} from '../size.js';
import { legacyTransaction, twoSignerLegacyTransaction, v0Transaction, v1Transaction } from './fixtures.js';

type MessageParts = { compiled: CompiledTransactionMessage; messageBytes: Uint8Array };

function partsOf(fixture: {
    compiled: () => CompiledTransactionMessage;
    messageBytes: () => Uint8Array;
}): MessageParts {
    return { compiled: fixture.compiled(), messageBytes: fixture.messageBytes() };
}

function encodedWireLength({ compiled, messageBytes }: MessageParts): number {
    const signers = compiled.staticAccounts.slice(0, compiled.header.numSignerAccounts);
    const signatures = Object.fromEntries(signers.map(signer => [signer, new Uint8Array(64) as SignatureBytes]));

    return getTransactionEncoder().encode({
        messageBytes: messageBytes as unknown as Transaction['messageBytes'],
        signatures,
    }).length;
}

describe('transactionSizeLimit', () => {
    it.each([
        ['legacy', 'legacy', legacyTransaction, LEGACY_TRANSACTION_SIZE_LIMIT],
        ['legacy', 'v0', v0Transaction, LEGACY_TRANSACTION_SIZE_LIMIT],
        ['v1', 'v1', v1Transaction, V1_TRANSACTION_SIZE_LIMIT],
    ] as const)('should return the %s limit for a %s transaction', (_limit, _version, fixture, expected) => {
        expect(transactionSizeLimit(fixture())).toBe(expected);
    });

    it.each([
        ['v1', 'v1', [0x81, 0x00], V1_TRANSACTION_SIZE_LIMIT],
        ['legacy', 'v0', [0x80, 0x00], LEGACY_TRANSACTION_SIZE_LIMIT],
        ['legacy', 'single-signer legacy', [0x01, 0x00], LEGACY_TRANSACTION_SIZE_LIMIT],
    ] as const)('should return the %s limit for %s message bytes', (_limit, _version, bytes, expected) => {
        expect(transactionSizeLimit(new Uint8Array(bytes))).toBe(expected);
    });

    it('should return the v1 limit for a v1 compiled message', () => {
        expect(transactionSizeLimit(v1Transaction.compiled())).toBe(V1_TRANSACTION_SIZE_LIMIT);
    });
});

describe('transactionWireSize', () => {
    it.each([
        ['legacy', partsOf(legacyTransaction)],
        ['v0', partsOf(v0Transaction)],
        ['v1', partsOf(v1Transaction)],
        ['two-signer legacy', twoSignerLegacyTransaction()],
    ] as const)('should match the encoded wire length of a %s transaction', (_label, parts) => {
        expect(transactionWireSize(parts.messageBytes)).toBe(encodedWireLength(parts));
    });
});
