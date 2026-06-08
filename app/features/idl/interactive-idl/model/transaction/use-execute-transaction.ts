'use client';

import { useParsedLogs } from '@entities/program-logs';
import { useWallet } from '@solana/wallet-adapter-react';
import {
    type Connection,
    type Finality,
    SendTransactionError,
    type Transaction,
    type TransactionError,
} from '@solana/web3.js';
import { useCallback, useState } from 'react';

import { Logger } from '@/app/shared/lib/logger';

import type { BaseIdl } from '../unified-program';
import { formatTransactionError } from './format-transaction-error';
import { serializeTransactionMessage, toBase64TransactionMessage } from './serialize-transaction-message';
import type { InstructionExecutionResult } from './types';

export function useExecuteTransaction(opts: {
    connection: Connection;
    commitment: Finality;
    idlErrors?: BaseIdl['errors'];
    onSuccess?: (signature: string) => void;
    onError?: (error: string) => void;
    onPreExecutionError?: (error: string) => void;
}) {
    const { connection, commitment, idlErrors, onSuccess, onError, onPreExecutionError } = opts;
    const { connected, publicKey, signTransaction } = useWallet();
    const [preExecutionError, setPreExecutionError] = useState<string>();
    const {
        handleBroadcastError,
        handlePreBroadcastError,
        handleTxEnd,
        handleTxStart,
        handleTxSuccess,
        isExecuting,
        lastResult,
        parseLogs,
    } = useExecutionState({ onError, onSuccess });

    const executeTx = useCallback(
        async (buildTx: () => Promise<Transaction>): Promise<void> => {
            if (!connected || !publicKey || !signTransaction) {
                const message = 'Wallet not connected';
                setPreExecutionError(message);
                onPreExecutionError?.(message);
                return;
            }
            setPreExecutionError(undefined);
            handleTxStart();
            let transaction: Transaction | undefined;
            let signature: string | undefined;
            try {
                // Build transaction
                transaction = await buildTx();
                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
                transaction.recentBlockhash = blockhash;

                // Sign with wallet
                const signed = await signTransaction(transaction);

                // Broadcast to chain.
                // skipPreflight: true because the UI exposes an explicit Simulate action.
                // Additional tooltip in ui highlights this.
                signature = await connection.sendRawTransaction(signed.serialize(), {
                    skipPreflight: true,
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
            onPreExecutionError,
        ],
    );

    return { executeTx, isExecuting, lastResult, parseLogs, preExecutionError };
}

function useExecutionState({
    onSuccess,
    onError,
}: {
    onSuccess?: (signature: string) => void;
    onError?: (error: string, signature?: string) => void;
}) {
    const [transactionError, setTransactionError] = useState<TransactionError>();
    const { parseLogs } = useParsedLogs(transactionError);
    const [isExecuting, setIsExecuting] = useState(false);
    const [lastResult, setLastResult] = useState<InstructionExecutionResult>();

    const handleTxStart = () => {
        setIsExecuting(true);
        setLastResult(undefined);
        setTransactionError(undefined);
    };

    const handleTxEnd = () => {
        setIsExecuting(false);
    };

    const handleTxSuccess = (signature: string, finalLogs: string[] | null | undefined) => {
        setLastResult({ finishedAt: new Date(), logs: finalLogs ?? [], signature, status: 'success' });
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
        setTransactionError(error instanceof Error ? undefined : (error as TransactionError));

        setLastResult({
            finishedAt: new Date(),
            logs,
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
        // SendTransactionError.logs is only populated by the preflight path;
        // With skipPreflight: true today these branches are irrelevant but kept as a safety net.
        const logs = error instanceof SendTransactionError ? (error.logs ?? []) : [];
        const message = error instanceof Error ? error.message : 'Failed to execute instruction';
        Logger.error(error, { transaction });
        if (error instanceof SendTransactionError) {
            setTransactionError(error);
        }
        setLastResult({
            finishedAt: new Date(),
            logs,
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
        parseLogs,
    };
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
