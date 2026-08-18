import {
    address,
    bytesEqual,
    type CompiledTransactionMessage,
    type CompiledTransactionMessageWithLifetime,
    decompileTransactionMessage,
    getCompiledTransactionMessageDecoder,
    getCompiledTransactionMessageEncoder,
    getTransactionEncoder,
    type Transaction,
    type TransactionMessage as KitTransactionMessage,
} from '@solana/kit';
import { MessageV0, PublicKey, VersionedTransaction } from '@solana/web3.js';

import { Logger } from '@/app/shared/lib/logger';

/**
 * Message-level resource limits carried by a v1 transaction.
 *
 * kit models this as `V1TransactionConfig` but does not export that type by name, so it is read
 * off the v1 arm of kit's `TransactionMessage` to stay in step with kit's definition.
 */
export type V1TransactionConfig = NonNullable<Extract<KitTransactionMessage, { version: 1 }>['config']>;

/**
 * The wire version prefix of a v1 transaction message: the version flag bit (0x80) with
 * version number 1. Legacy messages never set the flag bit, and a v0 message's first byte
 * is 0x80, so this single byte identifies v1 unambiguously.
 */
const V1_MESSAGE_PREFIX = 0x81;

export function isV1MessageBytes(bytes: Uint8Array): boolean {
    return bytes.length > 0 && bytes[0] === V1_MESSAGE_PREFIX;
}

/**
 * A web3.js view of a v1 compiled message.
 *
 * A v1 message is structurally a v0 message without address table lookups plus a config
 * section, so every field web3.js consumers read — header, static keys, instructions —
 * maps losslessly onto `MessageV0`. The one thing that cannot be synthesized is the wire
 * encoding: re-serializing through `MessageV0` would emit v0 bytes that are not the real
 * transaction. `serialize()` therefore returns the original v1 bytes, so signature
 * verification, simulation (`new VersionedTransaction(message)`), and cache fingerprints
 * all operate on the bytes the network sees.
 *
 * The inherited `version` getter still reports `0`; carry the true version alongside this
 * object rather than reading it off the message.
 *
 * `transactionConfig` carries the message-level resource limits, which `MessageV0` has nowhere to
 * put. It is absent when the message sets no limits at all — in v1 that means every limit is zero,
 * not that a default applies.
 */
export class V1MessageView extends MessageV0 {
    private readonly rawV1Bytes: Uint8Array;
    readonly transactionConfig?: V1TransactionConfig;

    constructor(
        args: ConstructorParameters<typeof MessageV0>[0],
        rawV1Bytes: Uint8Array,
        transactionConfig?: V1TransactionConfig,
    ) {
        super(args);
        this.rawV1Bytes = rawV1Bytes;
        this.transactionConfig = transactionConfig;
    }

    override serialize(): Uint8Array {
        return this.rawV1Bytes;
    }
}

/**
 * Decodes v1 transaction message bytes into a web3.js-compatible view plus the message-level
 * resource limits, when any are set.
 *
 * Throws if the bytes are not a valid v1 compiled message. The config is supplemental: if it
 * cannot be decompiled the message still renders, so that failure is logged rather than thrown.
 */
export function bridgeV1MessageBytes(messageBytes: Uint8Array): {
    message: V1MessageView;
    transactionConfig?: V1TransactionConfig;
} {
    const compiled = getCompiledTransactionMessageDecoder().decode(messageBytes);
    if (compiled.version !== 1) {
        throw new Error(`Expected a v1 transaction message, got version ${compiled.version}`);
    }

    // The decoder stops at the end of the message and ignores anything after it, so a full v1
    // wire transaction — message followed by signatures — decodes as if it were a bare message.
    // Re-encoding canonically catches that: the trailing bytes are dropped on re-encode. Without
    // this the signatures would be counted as part of the message and every consumer of the raw
    // bytes (size, signature verification, simulation) would be wrong.
    if (!bytesEqual(getCompiledTransactionMessageEncoder().encode(compiled), messageBytes)) {
        throw new Error('v1 transaction message bytes are not a canonical compiled message');
    }

    const transactionConfig = readV1TransactionConfig(compiled);
    const message = new V1MessageView(
        {
            addressTableLookups: [],
            compiledInstructions: compiled.instructionHeaders.map((header, i) => ({
                accountKeyIndexes: [...compiled.instructionPayloads[i].instructionAccountIndices],
                data: new Uint8Array(compiled.instructionPayloads[i].instructionData),
                programIdIndex: header.programAccountIndex,
            })),
            header: {
                numReadonlySignedAccounts: compiled.header.numReadonlySignerAccounts,
                numReadonlyUnsignedAccounts: compiled.header.numReadonlyNonSignerAccounts,
                numRequiredSignatures: compiled.header.numSignerAccounts,
            },
            recentBlockhash: compiled.lifetimeToken,
            staticAccountKeys: compiled.staticAccounts.map(address => new PublicKey(address)),
        },
        messageBytes,
        transactionConfig,
    );

    return { message, transactionConfig };
}

/**
 * The maximum size of a v1 transaction in bytes. kit defines the same constant but
 * intentionally does not export it.
 */
export const V1_TRANSACTION_SIZE_LIMIT = 4096;

/**
 * A `VersionedTransaction` over a bridged v1 message whose `serialize()` emits the v1 wire
 * envelope.
 *
 * v1 reorders the transaction envelope: the message comes first, followed by the signatures
 * with no count prefix — the count is read from the message header. The inherited
 * `serialize()` would wrap the message in the legacy signatures-first envelope, which a
 * v1-aware node rejects as an invalid message version, so this encodes through kit's
 * transaction encoder instead. Signatures are zero-filled, which is sufficient for
 * simulation.
 */
export class UnsignedV1WireTransaction extends VersionedTransaction {
    private readonly view: V1MessageView;

    constructor(message: V1MessageView) {
        super(message);
        this.view = message;
    }

    override serialize(): Uint8Array {
        const signatures = Object.fromEntries(
            this.view.staticAccountKeys
                .slice(0, this.view.header.numRequiredSignatures)
                // eslint-disable-next-line unicorn/no-null -- kit encodes a null signature as a zero-filled slot
                .map(key => [address(key.toBase58()), null]),
        ) as Transaction['signatures'];

        return new Uint8Array(
            getTransactionEncoder().encode({
                messageBytes: this.view.serialize() as unknown as Transaction['messageBytes'],
                signatures,
            }),
        );
    }
}

/**
 * Reads the message-level resource limits off a v1 compiled message.
 *
 * Returns `undefined` when the message sets no limits at all, so callers have no rows to render.
 * The limits are supplemental — the wire bytes still render, download, and inspect without them —
 * so a failure to decompile is logged and reported as absent rather than thrown. `logContext`
 * carries the caller's module tag and any identifying fields into that log line.
 */
export function readV1TransactionConfig(
    compiled: CompiledTransactionMessage & CompiledTransactionMessageWithLifetime & { version: 1 },
    logContext: Record<string, unknown> = { module: '[v1-message-bridge]' },
): V1TransactionConfig | undefined {
    try {
        const { config } = decompileTransactionMessage(compiled);
        return config && Object.values(config).some(value => value !== undefined) ? config : undefined;
    } catch (error) {
        Logger.error(error, logContext);
        return undefined;
    }
}
