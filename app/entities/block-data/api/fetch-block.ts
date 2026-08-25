import {
    createSolanaRpc,
    getBase58Decoder,
    getBase64Encoder,
    getTransactionDecoder,
    MAX_SUPPORTED_TRANSACTION_VERSION,
    type Slot,
    type Transaction,
} from '@solana/kit';
import { PublicKey, VersionedMessage } from '@solana/web3.js';
import { create } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';
import { bridgeV1MessageBytes, isV1MessageBytes } from '@/app/shared/lib/v1-message-bridge';

import {
    BlockResponseSchema,
    type BlockTransactionResponse,
    BlockTransactionResponseSchema,
} from '../model/block-response-schema';
import type { BlockTransaction, BlockWithV1 } from '../model/types';

/**
 * Fetches a block and its transactions for the block pages.
 *
 * `base64` encoding rather than `json` so each transaction arrives as the bytes the network holds:
 * those bytes are the only place a v1 transaction's resource limits can be found.
 */
// web3.js types `blockTime`, `postBalance` and `logMessages` as required `T | null`.
/* eslint-disable unicorn/no-null */
export async function fetchBlock(url: string, slot: number): Promise<BlockWithV1 | null> {
    const response = await createSolanaRpc(url)
        .getBlock(BigInt(slot) as Slot, {
            commitment: 'confirmed',
            encoding: 'base64',
            maxSupportedTransactionVersion: MAX_SUPPORTED_TRANSACTION_VERSION,
            rewards: true,
            transactionDetails: 'full',
        })
        .send();

    if (response === null) {
        // The cache providers distinguish "fetched, not found" from "not fetched yet" by null vs undefined.
        return null;
    }

    // A block missing any of these fields cannot be rendered at all, so validation failure surfaces
    // as a fetch error rather than a half-drawn page.
    const block = create(response, BlockResponseSchema);

    return {
        blockTime: block.blockTime === null ? null : Number(block.blockTime),
        blockhash: block.blockhash,
        parentSlot: Number(block.parentSlot),
        previousBlockhash: block.previousBlockhash,
        rewards: block.rewards?.map(reward => ({
            // Only staking and voting rewards carry a commission.
            commission: reward.commission,
            lamports: Number(reward.lamports),
            postBalance: reward.postBalance === null ? null : Number(reward.postBalance),
            pubkey: reward.pubkey,
            rewardType: reward.rewardType,
        })),
        transactions: block.transactions.flatMap((rpcTransaction, index) =>
            adaptTransactionOrDrop(rpcTransaction, index, slot),
        ),
    };
}

/**
 * Adapts one transaction, dropping it if either its shape or its bytes cannot be read.
 *
 * A single unreadable transaction costs its own row rather than the whole block: the cards derive
 * every position from the array this returns, so a shorter array stays internally consistent.
 */
function adaptTransactionOrDrop(rpcTransaction: unknown, index: number, slot: number): BlockTransaction[] {
    try {
        return [adaptTransaction(create(rpcTransaction, BlockTransactionResponseSchema))];
    } catch (error) {
        Logger.error(error, { index, sentry: true, slot });

        return [];
    }
}

/**
 * Adapts one block transaction from its wire bytes into the web3.js-shaped view the cards read.
 *
 * The cards need web3.js's `VersionedMessage` for `getAccountKeys` and `isAccountWritable`;
 * `bridgeV1MessageBytes` supplies that interface for v1 and also yields the resource limits.
 */
function adaptTransaction(rpcTransaction: BlockTransactionResponse): BlockTransaction {
    const wireBytes = new Uint8Array(getBase64Encoder().encode(rpcTransaction.transaction[0]));
    const transaction = getTransactionDecoder().decode(wireBytes);
    // The decoded bytes are a view over the response buffer; copy so the message owns its own.
    const messageBytes = new Uint8Array(transaction.messageBytes);
    // kit delivers the response's numeric fields as bigint, so the version comes from the bytes.
    const bridged = isV1MessageBytes(messageBytes) ? bridgeV1MessageBytes(messageBytes) : undefined;
    const message = bridged?.message ?? VersionedMessage.deserialize(messageBytes);

    return {
        meta: adaptMeta(rpcTransaction.meta),
        transaction: { message, signatures: toBase58Signatures(transaction.signatures) },
        transactionConfig: bridged?.transactionConfig,
        version: bridged ? 1 : message.version,
    };
}

/** Converts meta into web3.js `ConfirmedTransactionMeta`, whose numeric fields are all `number`. */
function adaptMeta(meta: BlockTransactionResponse['meta']): BlockTransaction['meta'] {
    if (meta === null) {
        // The cards distinguish "no meta recorded" from an empty one.
        return null;
    }

    return {
        computeUnitsConsumed: meta.computeUnitsConsumed === undefined ? undefined : Number(meta.computeUnitsConsumed),
        costUnits: meta.costUnits === undefined ? undefined : Number(meta.costUnits),
        err: meta.err,
        fee: Number(meta.fee),
        innerInstructions:
            meta.innerInstructions?.map(({ index, instructions }) => ({
                index,
                instructions: instructions.map(({ accounts, data, programIdIndex }) => ({
                    accounts: [...accounts],
                    data,
                    programIdIndex,
                })),
            })) ?? undefined,
        loadedAddresses: meta.loadedAddresses
            ? {
                  readonly: meta.loadedAddresses.readonly.map(address => new PublicKey(address)),
                  writable: meta.loadedAddresses.writable.map(address => new PublicKey(address)),
              }
            : undefined,
        logMessages: meta.logMessages === null ? null : [...meta.logMessages],
        postBalances: meta.postBalances.map(Number),
        // The RPC serves `null` for blocks written before it recorded token balances.
        postTokenBalances: meta.postTokenBalances ?? undefined,
        preBalances: meta.preBalances.map(Number),
        preTokenBalances: meta.preTokenBalances ?? undefined,
    };
}

/* eslint-enable unicorn/no-null */

/**
 * Renders a transaction's signatures in signer order.
 *
 * The map is insertion-ordered, matching the message's signer order. A transaction that reached a
 * block carries every required signature, so no slot is dropped in practice.
 */
function toBase58Signatures(signatures: Transaction['signatures']): string[] {
    const base58Decoder = getBase58Decoder();

    return Object.values(signatures)
        .filter(signature => signature !== null)
        .map(signature => base58Decoder.decode(signature));
}
