import { PMP_ADDRESS, type PmpDecodeConfig } from '@entities/pmp-account';
import {
    decodePmpInstructionData,
    PMP_METADATA_ACCOUNT_INDEX,
    PMP_OPTIONAL_BUFFER_ACCOUNT_INDEX,
    type PmpInstructionData,
} from '@entities/pmp-instruction';
import { getBase58Encoder } from '@solana/kit';
import type { VersionedTransactionResponse } from '@solana/web3.js';
import type { DataSource } from '@solana-program/program-metadata';

const BASE58_ENCODER = getBase58Encoder();

/**
 * A config recovered from transaction, and who it was declared for.
 */
export type ConfigResolutionFromTxResult =
    | { kind: 'not-found' }
    /** An instruction stated this config FOR this buffer. The strongest reading available. */
    | { kind: 'found-for-buffer-acc'; config: PmpDecodeConfig; dataSource?: DataSource; signature: string }
    /**
     * No instruction declared a config for this buffer, but its bytes were copied WHOLE into a metadata account in
     * the same transaction, and that account's config was declared there. Weaker than `found-for-buffer-acc` and
     * labelled differently in the UI, because the config describes the copy rather than this account.
     */
    | {
          kind: 'found-for-metadata-acc';
          config: PmpDecodeConfig;
          dataSource?: DataSource;
          signature: string;
          metadata: string;
      };

/**
 * The on-chain config-resolution strategy, applied to a single transaction.
 *
 * Two readings, strongest first: a config declared FOR this buffer, then one declared for the metadata account its
 * bytes were copied into. The order matters - a direct declaration must never be shadowed by the weaker inference.
 */
export function resolveConfigFromTransaction(
    tx: VersionedTransactionResponse,
    bufferAddress: string,
    signature: string,
): ConfigResolutionFromTxResult {
    const instructions = collectPmpInstructions(tx).flatMap(ix => {
        const data = decodePmpInstructionData(ix.data);
        return data ? [{ accountKeys: ix.accountKeys, data }] : [];
    });

    for (const { accountKeys, data } of instructions) {
        if (
            (data.kind === 'setData' && accountKeys[PMP_OPTIONAL_BUFFER_ACCOUNT_INDEX] === bufferAddress) ||
            (data.kind === 'initialize' && accountKeys[PMP_METADATA_ACCOUNT_INDEX] === bufferAddress)
        ) {
            return { config: data.config, dataSource: data.dataSource, kind: 'found-for-buffer-acc', signature };
        }
    }

    // The buffer's bytes may have been copied into a metadata account.
    const copied = findConfigForMetadataAcc(instructions, bufferAddress);
    return copied ? { ...copied, signature } : { kind: 'not-found' };
}

type PmpInstruction = { accountKeys: string[]; data: Uint8Array };
type DecodedPmpInstruction = { accountKeys: string[]; data: PmpInstructionData };

/**
 * Flattens a transaction's PMP instructions, top-level and inner alike.
 *
 * Account keys resolve through `getAccountKeys` with `loadedAddresses`, so an instruction reached through an
 * address lookup table names the same accounts the chain saw rather than indexing off the static keys alone.
 */
function collectPmpInstructions(tx: VersionedTransactionResponse): PmpInstruction[] {
    const { message } = tx.transaction;
    const keys = message.getAccountKeys({ accountKeysFromLookups: tx.meta?.loadedAddresses ?? undefined });
    const at = (index: number) => keys.get(index)?.toBase58() ?? '';

    // Inner instruction data is base58 on the wire, unlike the top-level `compiledInstructions` byte arrays.
    const inner = (tx.meta?.innerInstructions ?? []).flatMap(group =>
        group.instructions.map(ix => ({
            accountKeyIndexes: ix.accounts,
            data: new Uint8Array(BASE58_ENCODER.encode(ix.data)),
            programIdIndex: ix.programIdIndex,
        })),
    );

    return [...message.compiledInstructions, ...inner]
        .filter(ix => at(ix.programIdIndex) === PMP_ADDRESS)
        .map(ix => ({ accountKeys: ix.accountKeyIndexes.map(index => at(index)), data: ix.data }));
}

/**
 * Recovers the config declared for a metadata account this buffer's bytes were copied INTO.
 *
 * The canonical client builds a metadata account by `allocate`-ing the PDA, `write`-ing the payload across from a
 * source buffer, then `initialize`-ing it. The config is stated for the PDA, so a buffer used that way has none of
 * its own - yet its bytes are the very bytes the config describes, which is worth surfacing.
 *
 * Three conditions make that inference safe, and all three are checked rather than assumed:
 *
 * 1. **The copy starts at offset 0 and carries no inline data.** `write` can place a source buffer's bytes at ANY
 *    offset of a larger document. A config describing the assembled document would be wrong for a fragment - it
 *    would try to inflate the middle of a gzip stream.
 * 2. **This buffer is the only source.** More than one copy from this buffer is ambiguous about which landed.
 * 3. **Nothing else wrote to the destination in this transaction.** Two sources feeding one PDA means the config
 *    describes their concatenation, not this buffer alone.
 *
 * Same-transaction only, deliberately. Tracing a copy across transactions is unbounded, and the further apart the
 * write and the declaration are, the weaker the claim that the bytes never changed in between.
 */
function findConfigForMetadataAcc(decoded: DecodedPmpInstruction[], target: string) {
    const writes = decoded.filter(ix => ix.data.kind === 'write');

    // none means there is nothing to infer from.
    // more than one copy means this buffer was copied twice which is ambiguous.
    const copies = writes.filter(ix => isWholeDataWrite(ix, target));
    if (copies.length !== 1) return undefined;

    // `collectPmpInstructions` maps an unresolvable key index to an empty string rather than throwing, so a
    // malformed instruction arrives as `''` and has to be rejected explicitly.
    const metadata = copies[0].accountKeys[PMP_METADATA_ACCOUNT_INDEX];
    if (!metadata) return undefined;

    // Counting EVERY write to the destination rather than only the copies.
    const writesToMetadata = writes.filter(ix => ix.accountKeys[PMP_METADATA_ACCOUNT_INDEX] === metadata);
    if (writesToMetadata.length !== 1) return undefined;

    for (const { accountKeys, data } of decoded) {
        const isIxWithConfig = data.kind === 'setData' || data.kind === 'initialize';

        // Matched at index 0 for metadata account
        if (isIxWithConfig && accountKeys[PMP_METADATA_ACCOUNT_INDEX] === metadata) {
            return {
                config: data.config,
                dataSource: data.dataSource,
                kind: 'found-for-metadata-acc' as const,
                metadata,
            };
        }
    }

    return undefined;
}

/**
 * Whether this instruction copies `source`'s bytes WHOLE into the account at index 0.
 *
 * Four things have to hold, and each rules out a different way the inference could go wrong:
 * - it is a `write`, the only instruction that moves bytes from one account into another
 * - the source buffer at index 2 is the one being asked about, not some other buffer in the same transaction
 * - `offset === 0`, so the bytes land at the start of the destination rather than partway into a larger document.
 *   A config describing that assembled document would be wrong for a fragment - it would try to inflate the middle
 *   of a gzip stream
 * - no inline `chunk`, so the bytes came from the buffer rather than from the instruction's own data
 */
function isWholeDataWrite({ accountKeys, data }: DecodedPmpInstruction, source: string): boolean {
    return (
        data.kind === 'write' &&
        accountKeys[PMP_OPTIONAL_BUFFER_ACCOUNT_INDEX] === source &&
        data.offset === 0 &&
        data.chunk === undefined
    );
}
