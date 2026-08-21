import {
    array,
    bigint,
    type Infer,
    literal,
    nullable,
    number,
    optional,
    record,
    string,
    tuple,
    type,
    union,
    unknown,
} from 'superstruct';

/**
 * An unsigned integer as it arrives from the RPC.
 *
 * kit's JSON parser upcasts the integers its schema declares to `bigint` and leaves the rest as
 * `number`, so a field can hold either.
 */
const u64 = () => union([bigint(), number()]);

const TokenBalanceSchema = type({
    accountIndex: number(),
    mint: string(),
    owner: optional(string()),
    programId: optional(string()),
    uiTokenAmount: type({
        amount: string(),
        decimals: number(),
        uiAmount: nullable(number()),
        uiAmountString: optional(string()),
    }),
});

/** web3.js models a transaction error as an opaque object or a string. */
const TransactionErrorSchema = nullable(union([string(), record(string(), unknown())]));

const TransactionMetaSchema = nullable(
    type({
        computeUnitsConsumed: optional(u64()),
        /** Feeds the block history cost column and the block's cost total; kit's meta type omits it. */
        costUnits: optional(u64()),
        err: TransactionErrorSchema,
        fee: u64(),
        innerInstructions: optional(
            nullable(
                array(
                    type({
                        index: number(),
                        instructions: array(
                            type({
                                accounts: array(number()),
                                data: string(),
                                programIdIndex: number(),
                            }),
                        ),
                    }),
                ),
            ),
        ),
        loadedAddresses: optional(nullable(type({ readonly: array(string()), writable: array(string()) }))),
        logMessages: nullable(array(string())),
        postBalances: array(u64()),
        postTokenBalances: optional(nullable(array(TokenBalanceSchema))),
        preBalances: array(u64()),
        preTokenBalances: optional(nullable(array(TokenBalanceSchema))),
    }),
);

/**
 * One `getBlock` transaction under `base64` encoding.
 *
 * Validated per transaction rather than with the block so a shape surprise costs one row instead of
 * the whole page.
 */
export const BlockTransactionResponseSchema = type({
    meta: TransactionMetaSchema,
    transaction: tuple([string(), literal('base64')]),
});

/** The `getBlock` fields the block pages read. Transactions stay opaque here; see above. */
export const BlockResponseSchema = type({
    blockTime: nullable(u64()),
    blockhash: string(),
    parentSlot: u64(),
    previousBlockhash: string(),
    rewards: optional(
        nullable(
            array(
                type({
                    commission: optional(nullable(number())),
                    lamports: u64(),
                    postBalance: nullable(u64()),
                    pubkey: string(),
                    rewardType: nullable(string()),
                }),
            ),
        ),
    ),
    transactions: array(unknown()),
});

export type BlockResponse = Infer<typeof BlockResponseSchema>;
export type BlockTransactionResponse = Infer<typeof BlockTransactionResponseSchema>;
