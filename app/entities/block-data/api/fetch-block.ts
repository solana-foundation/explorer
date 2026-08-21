import {
    createSolanaRpc,
    getBase58Decoder,
    getBase64Encoder,
    getTransactionDecoder,
    MAX_SUPPORTED_TRANSACTION_VERSION,
    type Slot,
    type Transaction,
    type TransactionError,
} from '@solana/kit';
import { PublicKey, type TokenBalance, VersionedMessage } from '@solana/web3.js';

import { bridgeV1MessageBytes, isV1MessageBytes } from '@/app/shared/lib/v1-message-bridge';

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

    return {
        blockTime: response.blockTime === null ? null : Number(response.blockTime),
        blockhash: response.blockhash,
        parentSlot: Number(response.parentSlot),
        previousBlockhash: response.previousBlockhash,
        rewards: response.rewards?.map(reward => ({
            // Only staking and voting rewards carry a commission.
            commission: 'commission' in reward ? reward.commission : undefined,
            lamports: Number(reward.lamports),
            postBalance: reward.postBalance === null ? null : Number(reward.postBalance),
            pubkey: reward.pubkey,
            rewardType: reward.rewardType,
        })),
        transactions: response.transactions.map(adaptTransaction),
    };
}

/** Numeric fields the RPC serves that kit's meta type does not declare. `costUnits` feeds the block
 *  history cost column and the block's cost total. */
type UndeclaredMeta = Readonly<{ costUnits?: number | bigint }>;

type RpcBlockTransaction = Readonly<{
    meta:
        | (Readonly<{
              computeUnitsConsumed?: bigint;
              err: TransactionError | null;
              fee: bigint;
              innerInstructions?:
                  | readonly Readonly<{
                        index: number;
                        instructions: readonly Readonly<{
                            accounts: readonly number[];
                            data: string;
                            programIdIndex: number;
                        }>[];
                    }>[]
                  | null;
              loadedAddresses?: Readonly<{ readonly: readonly string[]; writable: readonly string[] }> | null;
              logMessages: readonly string[] | null;
              postBalances: readonly bigint[];
              postTokenBalances?: readonly TokenBalance[];
              preBalances: readonly bigint[];
              preTokenBalances?: readonly TokenBalance[];
          }> &
              UndeclaredMeta)
        | null;
    transaction: readonly [string, 'base64'];
}>;

/**
 * Adapts one block transaction from its wire bytes into the web3.js-shaped view the cards read.
 *
 * The cards need web3.js's `VersionedMessage` for `getAccountKeys` and `isAccountWritable`;
 * `bridgeV1MessageBytes` supplies that interface for v1 and also yields the resource limits.
 */
function adaptTransaction(rpcTransaction: RpcBlockTransaction): BlockTransaction {
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
function adaptMeta(meta: RpcBlockTransaction['meta']): BlockTransaction['meta'] {
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
        postTokenBalances: meta.postTokenBalances === undefined ? undefined : [...meta.postTokenBalances],
        preBalances: meta.preBalances.map(Number),
        preTokenBalances: meta.preTokenBalances === undefined ? undefined : [...meta.preTokenBalances],
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
