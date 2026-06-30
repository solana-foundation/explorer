'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import {
    type Connection,
    type Finality,
    SendTransactionError,
    type Transaction,
    type TransactionError,
} from '@solana/web3.js';
import { useCallback, useState } from 'react';

import { useCluster } from '@/app/providers/cluster';
import { Logger } from '@/app/shared/lib/logger';

import type { BaseIdl } from '../unified-program';
import { formatTransactionError } from './format-transaction-error';
import { toResultLogs } from './parse-result-logs';
import { serializeTransactionMessage, toBase64TransactionMessage } from './serialize-transaction-message';
import type { ExecutionOptions, InstructionExecutionResult } from './types';

export function useExecuteTransaction(opts: {
    connection: Connection;
    commitment: Finality;
    idlErrors?: BaseIdl['errors'];
    onSuccess?: (signature: string) => void;
    // signature is present for broadcast failures.
    // undefined for pre-broadcast failures (build/sign).
    onError?: (error: string, signature?: string) => void;
}) {
    const { connection, commitment, idlErrors, onSuccess, onError } = opts;
    const { connected, publicKey, signTransaction } = useWallet();
    const {
        handleBroadcastError,
        handlePreBroadcastError,
        handleTxEnd,
        handleTxStart,
        handleTxSuccess,
        isExecuting,
        lastResult,
    } = useExecutionState({ onError, onSuccess });

    const executeTx = useCallback(
        async (buildTx: () => Promise<Transaction>, options?: ExecutionOptions): Promise<void> => {
            handleTxStart();
            let transaction: Transaction | undefined;
            let signature: string | undefined;
            try {
                if (!connected || !publicKey || !signTransaction) {
                    throw new Error('Wallet not connected');
                }

                // Build transaction
                transaction = await buildTx();
                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
                transaction.recentBlockhash = blockhash;

                // Sign with wallet
                const signed = await signTransaction(transaction);

                // Broadcast to chain.
                // Preflight simulation is decided by the user via UI. Off by default
                signature = await connection.sendRawTransaction(signed.serialize(), {
                    skipPreflight: !(options?.simulate ?? false),
                });

                // Confirm and fetch
                const confirmed = await connection.confirmTransaction(
                    { blockhash, lastValidBlockHeight, signature },
                    commitment,
                );
                const published = await connection.getTransaction(signature, {
                    commitment,
                    maxSupportedTransactionVersion: 0,
                });
                const finalLogs = published?.meta?.logMessages ?? [];

                // Handle errors from rpc
                if (confirmed.value?.err) {
                    handleBroadcastError(confirmed.value.err, transaction, { idlErrors, logs: finalLogs, signature });
                    return;
                }

                handleTxSuccess(signature, finalLogs);
            } catch (error) {
                if (signature && transaction) {
                    handleBroadcastError(error, transaction, { signature });
                } else {
                    handlePreBroadcastError(error, transaction);
                }
            } finally {
                handleTxEnd();
            }
        },
        [
            connected,
            publicKey,
            signTransaction,
            connection,
            commitment,
            idlErrors,
            handleTxStart,
            handleTxSuccess,
            handleBroadcastError,
            handlePreBroadcastError,
            handleTxEnd,
        ],
    );

    return { executeTx, isExecuting, lastResult };
}

function useExecutionState({
    onSuccess,
    onError,
}: {
    onSuccess?: (signature: string) => void;
    onError?: (error: string, signature?: string) => void;
}) {
    const { cluster } = useCluster();
    const [isExecuting, setIsExecuting] = useState(false);
    const [lastResult, setLastResult] = useState<InstructionExecutionResult>();

    const handleTxStart = () => {
        setIsExecuting(true);
        setLastResult(undefined);
    };

    const handleTxEnd = () => {
        setIsExecuting(false);
    };

    const handleTxSuccess = (signature: string, finalLogs: string[] | null | undefined) => {
        const logs = finalLogs ?? [];
        setLastResult({
            finishedAt: new Date(),
            kind: 'execution',
            logs: toResultLogs(logs, undefined, cluster),
            signature,
            status: 'success',
        });
        onSuccess?.(signature);
    };

    // Tx was broadcast: on-chain confirmation returned err, or confirm/getTransaction threw afterward.
    const handleBroadcastError = (
        error: unknown,
        transaction: Transaction,
        options: {
            idlErrors?: BaseIdl['errors'];
            logs?: string[];
            signature: string;
        },
    ) => {
        const logs = options.logs ?? [];
        const message = getMessageFromBroadcastError(error, options.idlErrors);
        Logger.error(error, { signature: options.signature, transaction });
        // A structured TransactionError annotates the failed instruction in the parsed logs;
        // a caught Error instance carries no such structure.
        const txError = error instanceof Error ? undefined : (error as TransactionError);

        setLastResult({
            finishedAt: new Date(),
            kind: 'execution',
            logs: toResultLogs(logs, txError, cluster),
            message,
            phase: 'broadcast_failed',
            serializedTxMessage: toBase64TransactionMessage(transaction),
            signature: options.signature,
            status: 'error',
        });
        onError?.(message, options.signature);
    };

    // Local error before broadcast: buildTx threw, wallet rejected sign, or sendRawTransaction threw.
    const handlePreBroadcastError = (error: unknown, transaction: Transaction | undefined) => {
        const signature = undefined;
        // SendTransactionError.logs is only populated by the preflight path.
        // Preflight runs when the user enables the Simulation in the UI.
        // Off by default.
        const logs = error instanceof SendTransactionError ? (error.logs ?? []) : [];
        const message = getPreBroadcastErrorMessage(error);
        Logger.error(error, { transaction });
        setLastResult({
            finishedAt: new Date(),
            kind: 'execution',
            // No structured on-chain TransactionError before broadcast, so logs are not annotated.
            logs: toResultLogs(logs, undefined, cluster),
            message,
            phase: 'pre_broadcast_failed',
            serializedTxMessage: serializeTransactionMessage(transaction),
            status: 'error',
        });

        onError?.(message, signature);
    };

    return {
        handleBroadcastError,
        handlePreBroadcastError,
        handleTxEnd,
        handleTxStart,
        handleTxSuccess,
        isExecuting,
        lastResult,
    };
}

function getPreBroadcastErrorMessage(error: unknown): string {
    // SendTransactionError.message embeds the full preflight logs.
    // Prefer the concise transactionError.message so the logs doesn't render in the message.
    if (error instanceof SendTransactionError) return error.transactionError.message;
    if (error instanceof Error) return error.message;
    return 'Failed to execute instruction';
}

const DEFAULT_BROADCASTED_ERROR_MESSAGE = 'Failed to send transaction';
function getMessageFromBroadcastError(error: unknown, idlErrors: BaseIdl['errors'] | undefined): string {
    if (error instanceof Error) {
        return error.message || DEFAULT_BROADCASTED_ERROR_MESSAGE;
    }
    try {
        return formatTransactionError(error as TransactionError, idlErrors);
    } catch (e) {
        Logger.error(e, { error });
        return DEFAULT_BROADCASTED_ERROR_MESSAGE;
    }
}
