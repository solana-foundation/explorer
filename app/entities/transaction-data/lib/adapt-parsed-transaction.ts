import {
    type ParsedInstruction,
    type ParsedMessageAccount,
    type PartiallyDecodedInstruction,
    PublicKey,
    type TokenBalance,
    type TransactionError,
} from '@solana/web3.js';

import type { TransactionVersion, TransactionWithMeta } from '../model/types';

type RpcAccountKey = Readonly<{
    pubkey: string;
    signer: boolean;
    /** Whether the address was declared in the message or resolved from an address lookup table. */
    source: 'lookupTable' | 'transaction';
    writable: boolean;
}>;

type RpcInstruction =
    | Readonly<{ parsed: unknown; program: string; programId: string }>
    | Readonly<{ accounts: readonly string[]; data: string; programId: string }>;

type RpcTokenBalance = Readonly<{
    accountIndex: number;
    mint: string;
    owner?: string;
    programId?: string;
    uiTokenAmount: Readonly<{
        amount: string;
        decimals: number;
        uiAmount: number | null;
        uiAmountString: string;
    }>;
}>;

type RpcMeta = Readonly<{
    computeUnitsConsumed?: bigint;
    /**
     * Served by the RPC but absent from kit's meta type, and it drives the "Transaction cost"
     * row. Numeric fields arrive as bigint only where kit declares them, so an undeclared field
     * can be either.
     */
    costUnits?: number | bigint;
    err: TransactionError | null;
    fee: bigint;
    innerInstructions?: readonly Readonly<{ index: number; instructions: readonly RpcInstruction[] }>[] | null;
    loadedAddresses?: Readonly<{ readonly: readonly string[]; writable: readonly string[] }>;
    logMessages: readonly string[] | null;
    postBalances: readonly bigint[];
    postTokenBalances?: readonly RpcTokenBalance[];
    preBalances: readonly bigint[];
    preTokenBalances?: readonly RpcTokenBalance[];
}>;

/**
 * A `getTransaction` response under `jsonParsed` encoding, as delivered by kit.
 *
 * Declared structurally rather than derived from kit's overloaded `GetTransactionApi`, which
 * resolves to whichever overload is declared last regardless of the encoding requested.
 */
export type RpcParsedTransaction = Readonly<{
    blockTime: bigint | null;
    meta: RpcMeta | null;
    slot: bigint;
    transaction: Readonly<{
        message: Readonly<{
            accountKeys: readonly RpcAccountKey[];
            instructions: readonly RpcInstruction[];
            recentBlockhash: string;
        }>;
        signatures: readonly string[];
    }>;
    version?: TransactionVersion;
}>;

/**
 * Converts a kit `getTransaction` response into the web3.js-shaped transaction the detail page
 * renders.
 *
 * kit is the only client that can read v1 — web3.js validates the version against a
 * `'legacy' | 0` union and throws on anything newer — but every consumer downstream of the
 * transaction providers is written against web3.js types, so the response is adapted rather
 * than propagated.
 */
// web3.js types `blockTime` and `meta` as required `T | null`, so null is the contract here,
// not a stylistic choice.
/* eslint-disable unicorn/no-null */
export function adaptParsedTransaction(response: RpcParsedTransaction): TransactionWithMeta {
    const { message, signatures } = response.transaction;

    return {
        blockTime: response.blockTime === null ? null : Number(response.blockTime),
        meta: adaptMeta(response.meta),
        slot: Number(response.slot),
        transaction: {
            message: {
                accountKeys: message.accountKeys.map(adaptAccountKey),
                instructions: message.instructions.map(adaptInstruction),
                recentBlockhash: message.recentBlockhash,
            },
            signatures: [...signatures],
        },
        version: response.version,
    };
}

function adaptMeta(meta: RpcMeta | null): TransactionWithMeta['meta'] {
    if (meta === null) {
        return null;
    }

    return {
        computeUnitsConsumed: toOptionalNumber(meta.computeUnitsConsumed),
        costUnits: toOptionalNumber(meta.costUnits),
        err: meta.err,
        fee: Number(meta.fee),
        innerInstructions: meta.innerInstructions?.map(({ index, instructions }) => ({
            index,
            instructions: instructions.map(adaptInstruction),
        })),
        loadedAddresses: meta.loadedAddresses && {
            readonly: meta.loadedAddresses.readonly.map(address => new PublicKey(address)),
            writable: meta.loadedAddresses.writable.map(address => new PublicKey(address)),
        },
        logMessages: meta.logMessages && [...meta.logMessages],
        postBalances: meta.postBalances.map(Number),
        postTokenBalances: meta.postTokenBalances?.map(adaptTokenBalance),
        preBalances: meta.preBalances.map(Number),
        preTokenBalances: meta.preTokenBalances?.map(adaptTokenBalance),
    };
}
/* eslint-enable unicorn/no-null */

function adaptAccountKey(accountKey: RpcAccountKey): ParsedMessageAccount {
    return {
        pubkey: new PublicKey(accountKey.pubkey),
        signer: accountKey.signer,
        source: accountKey.source,
        writable: accountKey.writable,
    };
}

function adaptInstruction(instruction: RpcInstruction): ParsedInstruction | PartiallyDecodedInstruction {
    if ('parsed' in instruction) {
        return {
            parsed: instruction.parsed,
            program: instruction.program,
            programId: new PublicKey(instruction.programId),
        };
    }

    return {
        accounts: instruction.accounts.map(account => new PublicKey(account)),
        data: instruction.data,
        programId: new PublicKey(instruction.programId),
    };
}

function adaptTokenBalance(tokenBalance: RpcTokenBalance): TokenBalance {
    return {
        accountIndex: tokenBalance.accountIndex,
        mint: tokenBalance.mint,
        owner: tokenBalance.owner,
        programId: tokenBalance.programId,
        uiTokenAmount: { ...tokenBalance.uiTokenAmount },
    };
}

function toOptionalNumber(value: number | bigint | undefined): number | undefined {
    return value === undefined ? undefined : Number(value);
}
