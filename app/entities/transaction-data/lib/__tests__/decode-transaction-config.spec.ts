import { getCompiledTransactionMessageDecoder } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { createV1TransactionBytes, createWeb3TransactionMessage } from '../../__fixtures__/wire-transactions';
import { decodeTransactionConfig } from '../decode-transaction-config';
import { decodeWireTransaction } from '../decode-wire-transaction';

function decodeConfigFromWire(bytes: Uint8Array) {
    return decodeTransactionConfig(decodeWireTransaction(bytes).compiledMessage);
}

describe('decodeTransactionConfig', () => {
    it('should read every resource limit a v1 message carries', () => {
        const bytes = createV1TransactionBytes({
            computeUnitLimit: 8442,
            heapSize: 262_144,
            loadedAccountsDataSizeLimit: 75_013,
            priorityFeeLamports: 10_000n,
        });

        expect(decodeConfigFromWire(bytes)).toEqual({
            computeUnitLimit: 8442,
            heapSize: 262_144,
            loadedAccountsDataSizeLimit: 75_013,
            priorityFeeLamports: 10_000n,
        });
    });

    it('should leave limits the message omits undefined', () => {
        const bytes = createV1TransactionBytes({ computeUnitLimit: 8442 });

        expect(decodeConfigFromWire(bytes)).toEqual({
            computeUnitLimit: 8442,
            heapSize: undefined,
            loadedAccountsDataSizeLimit: undefined,
            priorityFeeLamports: undefined,
        });
    });

    it('should return undefined for a v1 message that sets no limits', () => {
        expect(decodeConfigFromWire(createV1TransactionBytes({}))).toBeUndefined();
    });

    it.each([
        ['legacy', (message: ReturnType<typeof createWeb3TransactionMessage>) => message.compileToLegacyMessage()],
        ['v0', (message: ReturnType<typeof createWeb3TransactionMessage>) => message.compileToV0Message()],
    ])('should return undefined for a %s message, which carries no config', (_name, compile) => {
        const compiledMessage = getCompiledTransactionMessageDecoder().decode(
            compile(createWeb3TransactionMessage()).serialize(),
        );

        expect(decodeTransactionConfig(compiledMessage)).toBeUndefined();
    });
});

describe('decodeWireTransaction', () => {
    it('should round-trip the message bytes and expose the compiled v1 message', () => {
        const bytes = createV1TransactionBytes({ computeUnitLimit: 8442 });

        const { compiledMessage, messageBytes, signatures } = decodeWireTransaction(bytes);

        expect(compiledMessage.version).toBe(1);
        expect(signatures).toHaveLength(1);
        // v1 puts the message first in the envelope, followed by the signature array.
        expect(messageBytes.length).toBeLessThan(bytes.length);
        expect(bytes.subarray(0, messageBytes.length)).toEqual(messageBytes);
    });

    it('should leave an unsigned signer slot undefined rather than reporting a zero signature', () => {
        const { signatures } = decodeWireTransaction(createV1TransactionBytes({}));

        expect(signatures).toEqual([undefined]);
    });
});
