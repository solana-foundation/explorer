import { gen } from '@__fixtures__/gen';
import {
    address,
    appendTransactionMessageInstruction,
    blockhash,
    compileTransaction,
    createTransactionMessage,
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

export const FEE_PAYER = address(gen.address(1));
export const RECIPIENT = address(gen.address(2));
const PROGRAM = address(gen.address(3));
const BLOCKHASH = blockhash(gen.blockhash());

export type V1ConfigOverrides = {
    computeUnitLimit?: number;
    heapSize?: number;
    loadedAccountsDataSizeLimit?: number;
    priorityFeeLamports?: bigint;
};

/** Wire bytes of an unsigned v1 transaction carrying whichever resource limits are passed. */
export function createV1TransactionBytes(config: V1ConfigOverrides): Uint8Array {
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

/** A single-transfer web3.js message, for the versions web3.js can build. */
export function createWeb3TransactionMessage(): TransactionMessage {
    return new TransactionMessage({
        instructions: [
            SystemProgram.transfer({
                fromPubkey: new PublicKey(FEE_PAYER),
                lamports: 1n,
                toPubkey: new PublicKey(RECIPIENT),
            }),
        ],
        payerKey: new PublicKey(FEE_PAYER),
        recentBlockhash: PublicKey.default.toBase58(),
    });
}

/**
 * Wire bytes of an unsigned legacy or v0 transaction.
 *
 * Signatures on the wire are fixed-count and zero-filled until signed, so an unsigned transaction
 * carries one all-zero signature for its fee payer.
 */
export function createWeb3TransactionBytes(version: 'legacy' | 0): Uint8Array {
    const message = createWeb3TransactionMessage();
    const compiled = version === 'legacy' ? message.compileToLegacyMessage() : message.compileToV0Message();
    const messageBytes = compiled.serialize();
    const bytes = new Uint8Array(1 + 64 + messageBytes.length);
    bytes[0] = 1;
    bytes.set(messageBytes, 1 + 64);

    return bytes;
}
