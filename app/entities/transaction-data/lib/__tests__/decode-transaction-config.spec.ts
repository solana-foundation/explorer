import {
    appendTransactionMessageInstruction,
    type Blockhash,
    compileTransaction,
    createTransactionMessage,
    getAddressDecoder,
    getCompiledTransactionMessageDecoder,
    getTransactionEncoder,
    pipe,
    setTransactionMessageComputeUnitLimit,
    setTransactionMessageFeePayer,
    setTransactionMessageHeapSize,
    setTransactionMessageLifetimeUsingBlockhash,
    setTransactionMessageLoadedAccountsDataSizeLimit,
    setTransactionMessagePriorityFeeLamports,
} from '@solana/kit';
import { PublicKey, SystemProgram, TransactionMessage } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { decodeTransactionConfig } from '../decode-transaction-config';
import { decodeWireTransaction } from '../decode-wire-transaction';

const testAddress = (seed: number) => getAddressDecoder().decode(new Uint8Array(32).fill(seed));

const FEE_PAYER = testAddress(1);
const RECIPIENT = testAddress(2);
const PROGRAM = testAddress(3);
const BLOCKHASH = testAddress(9) as string as Blockhash;

type ConfigOverrides = {
    computeUnitLimit?: number;
    heapSize?: number;
    loadedAccountsDataSizeLimit?: number;
    priorityFeeLamports?: bigint;
};

function createV1TransactionBytes(config: ConfigOverrides): Uint8Array {
    const message = pipe(
        // @ts-expect-error `createTransactionMessage` constrains its version parameter to
        // `Exclude<TransactionVersion, 1>`. The runtime path is complete, so v1 messages compile and
        // encode correctly; only the type gate is missing. Remove once kit lifts the exclusion.
        createTransactionMessage({ version: 1 }),
        m => setTransactionMessageFeePayer(FEE_PAYER, m),
        m => setTransactionMessageLifetimeUsingBlockhash({ blockhash: BLOCKHASH, lastValidBlockHeight: 100n }, m),
        m =>
            appendTransactionMessageInstruction(
                { accounts: [{ address: RECIPIENT, role: 1 }], data: new Uint8Array([1]), programAddress: PROGRAM },
                m,
            ),
        // Every setter treats `undefined` as "leave unset", so omitted limits need no branching.
        m => setTransactionMessageComputeUnitLimit(config.computeUnitLimit, m),
        m => setTransactionMessageHeapSize(config.heapSize, m),
        m => setTransactionMessageLoadedAccountsDataSizeLimit(config.loadedAccountsDataSizeLimit, m),
        // The cast is needed only because the `@ts-expect-error` above leaves the message typed as
        // `legacy | 0`; this setter is constrained to `{ version: 1 }`.
        m => setTransactionMessagePriorityFeeLamports(config.priorityFeeLamports, m as typeof m & { version: 1 }),
    );

    return new Uint8Array(getTransactionEncoder().encode(compileTransaction(message)));
}

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
        ['legacy', (message: TransactionMessage) => message.compileToLegacyMessage()],
        ['v0', (message: TransactionMessage) => message.compileToV0Message()],
    ])('should return undefined for a %s message, which carries no config', (_name, compile) => {
        const compiledMessage = getCompiledTransactionMessageDecoder().decode(
            compile(
                new TransactionMessage({
                    instructions: [
                        SystemProgram.transfer({
                            fromPubkey: new PublicKey(FEE_PAYER),
                            lamports: 1n,
                            toPubkey: new PublicKey(RECIPIENT),
                        }),
                    ],
                    payerKey: new PublicKey(FEE_PAYER),
                    recentBlockhash: PublicKey.default.toBase58(),
                }),
            ).serialize(),
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
});
