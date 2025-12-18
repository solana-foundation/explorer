'use client';

import type { InstructionData } from '@entities/idl';
import { useParsedLogs } from '@entities/program-logs';
import { useWallet } from '@solana/wallet-adapter-react';
import {
    type Commitment,
    Connection,
    type Finality,
    PublicKey,
    type RpcResponseAndContext,
    SendTransactionError,
    type SimulatedTransactionResponse,
    Transaction,
    type TransactionError,
    TransactionInstruction,
    VersionedTransaction,
} from '@solana/web3.js';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useCluster } from '@/app/providers/cluster';
import { clusterUrl } from '@/app/utils/cluster';

import { programAtom } from '../model/state-atoms';
import { AnchorInterpreter } from './anchor/anchor-interpreter';
import { IdlExecutor, populateAccounts, populateArguments } from './idl-executor';
import type { UnifiedWallet } from './unified-program';
import { BaseIdl } from './unified-program';

interface UseInstructionOptions {
    programId?: string;
    cluster?: string;
    idl?: BaseIdl;
    enabled?: boolean;
    interpreterName?: typeof AnchorInterpreter.NAME;
    commitment?: Finality;
    /** Commitment level for transaction simulation. Defaults to 'processed'. */
    simulationCommitment?: Commitment;
}

interface UseInstructionReturn {
    // Execution
    invokeInstruction: (
        instructionName: string,
        instruction: InstructionData,
        params: {
            accounts: any;
            arguments: Record<string, string>;
        }
    ) => Promise<void>;

    // Validation helpers
    validateInstruction: (
        instructionName: string,
        instruction: InstructionData
    ) => { isValid: boolean; errors: string[] };

    // Status
    isExecuting: boolean;
    preInvocationError: string | null;
    lastResult: InstructionInvocationResult;
    parseLogs: ReturnType<typeof useParsedLogs>['parseLogs'];
    initializeProgram: () => void;
    isProgramLoading: boolean;
    program: any;
    initializationError: string | null;
}

export function useInstruction({
    programId: pid,
    cluster,
    idl,
    enabled = true,
    interpreterName = AnchorInterpreter.NAME,
    commitment = 'confirmed',
    simulationCommitment = 'processed',
}: UseInstructionOptions): UseInstructionReturn {
    const { connected, publicKey, ...wallet } = useWallet();
    const { cluster: currentCluster, customUrl } = useCluster();

    const [preInvocationError, setPreInvocationError] = useState<string | null>(null);
    const {
        isExecuting,
        lastResult,
        handleTxStart,
        handleTxSuccess,
        handleTxError,
        handleTxEnd,
        handleSimulatedTxResult,
        parseLogs,
    } = useInvocationState();
    const [initializationError, setInitializationError] = useState<string | null>(null);
    const [isProgramLoading, setIsProgramLoading] = useState(false);
    const [program, setProgram] = useAtom(programAtom);

    const programId = useMemo(() => (pid ? new PublicKey(pid) : undefined), [pid]);

    // Get connection for the specified cluster
    const connection = useMemo(() => {
        const endpoint = cluster || clusterUrl(currentCluster, customUrl);
        return new Connection(endpoint);
    }, [cluster, currentCluster, customUrl]);

    /// Allow to create Executor instance and update cluster-dependent connection
    const executorRef = useRef<IdlExecutor>();
    const executor = useMemo(() => {
        if (!executorRef.current) {
            executorRef.current = new IdlExecutor({ connection });
        }
        return executorRef.current;
    }, [connection]);

    const unifiedWallet = useMemo<UnifiedWallet | undefined>(() => {
        if (!publicKey) return undefined;
        return {
            publicKey,
            signAllTransactions:
                wallet.signAllTransactions ||
                (async () => {
                    throw new Error('Wallet not connected');
                }),
            signTransaction:
                wallet.signTransaction ||
                (async () => {
                    throw new Error('Wallet not connected');
                }),
        };
    }, [publicKey, wallet.signAllTransactions, wallet.signTransaction]);

    const initializeProgram = useCallback(async () => {
        // Don't throw if wallet is missing, just skip initialization
        // It will be initialized when wallet becomes available
        if (!enabled || !idl || !programId || !unifiedWallet) {
            return;
        }

        setIsProgramLoading(true);
        setInitializationError(null);

        try {
            const p = await executor.initializeProgram(idl, programId, unifiedWallet, interpreterName);
            setProgram(p);
            setInitializationError(null);
        } catch (error) {
            const errorMessage = handleInitializeError(error);

            console.error('Program initialization failed:', errorMessage);
            setInitializationError(errorMessage);
            setProgram(undefined);
        } finally {
            setIsProgramLoading(false);
        }
    }, [enabled, idl, programId, executor, unifiedWallet, interpreterName, setProgram]);

    // Track initialization key to prevent re-runs
    const initKeyRef = useRef<string>('');
    // Single effect to handle initialization
    useEffect(() => {
        const initKey = `${enabled}-${!!idl}-${programId?.toString()}-${publicKey?.toString()}`;

        if (!enabled) {
            // Clear when disabled
            if (program) {
                setProgram(undefined);
                setInitializationError(null);
                setIsProgramLoading(false);
            }
            initKeyRef.current = '';
            return;
        }

        // Check if we should initialize
        // Initialize when wallet becomes available and we haven't tried with this key yet
        const shouldInit = enabled && idl && programId && unifiedWallet && !program && !isProgramLoading;

        if (shouldInit) {
            // Only initialize if the key has changed (prevents re-runs)
            if (initKeyRef.current !== initKey) {
                initKeyRef.current = initKey;
                initializeProgram();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, idl, programId, publicKey, unifiedWallet, program, isProgramLoading, setProgram]);

    // Clear program when key dependencies change to ensure fresh initialization
    useEffect(() => {
        if (program) {
            setProgram(undefined);
            setInitializationError(null);
            initKeyRef.current = '';
        }
    }, [idl, programId?.toString()]); // eslint-disable-line react-hooks/exhaustive-deps

    // Validation helper to check if an instruction is ready to execute
    const validateInstruction = useCallback((_instructionName: string, _instruction: InstructionData) => {
        const errors: string[] = [];

        return {
            errors,
            isValid: errors.length === 0,
        };
    }, []);

    // Main function to invoke an instruction
    const invokeInstruction = useCallback(
        async (
            instructionName: string,
            instruction: InstructionData,
            params: {
                accounts: any;
                arguments: Record<string, string>;
            }
        ): Promise<void> => {
            if (!connected || !publicKey || !wallet.signTransaction) {
                setPreInvocationError('Wallet not connected');
                return;
            }
            setPreInvocationError(null);
            handleTxStart();

            let transaction: Transaction | undefined;

            try {
                if (!idl) throw new Error('Idl is absent');
                if (!program) throw new Error('Program is not initialized');
                if (!wallet) throw new Error('Wallet is not initialized');

                const ix = await executor.getInstruction(
                    program,
                    instructionName,
                    populateAccounts(params.accounts, instructionName),
                    populateArguments(params.arguments, instructionName),
                    idl,
                    interpreterName
                );

                if (ix instanceof TransactionInstruction) {
                    // Create and sign transaction
                    transaction = new Transaction().add(ix);
                } else {
                    throw new Error('Unsuported instruction format');
                }

                // Get recent blockhash
                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
                transaction.recentBlockhash = blockhash;
                transaction.feePayer = publicKey;

                // Simulate the transaction
                const simulatedTx = await connection.simulateTransaction(
                    new VersionedTransaction(transaction.compileMessage()),
                    {
                        commitment: simulationCommitment,
                    }
                );
                handleSimulatedTxResult(simulatedTx);

                // Sign the transaction
                const signedTransaction = await wallet.signTransaction(transaction);

                const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
                    skipPreflight: false,
                });

                const confirmed = await connection.confirmTransaction(
                    {
                        blockhash,
                        lastValidBlockHeight,
                        signature,
                    },
                    commitment
                );

                if (confirmed.value?.err) {
                    throw new Error('Transaction was not confirmed');
                }

                const publishedTransaction = await connection.getTransaction(signature, {
                    commitment,
                    maxSupportedTransactionVersion: 0,
                });

                handleTxSuccess(signature, publishedTransaction?.meta?.logMessages);
            } catch (error) {
                handleTxError(error, transaction);
            } finally {
                handleTxEnd();
            }
        },
        [
            connected,
            publicKey,
            wallet,
            connection,
            idl,
            executor,
            program,
            interpreterName,
            commitment,
            simulationCommitment,
            handleTxStart,
            handleTxSuccess,
            handleTxError,
            handleTxEnd,
            handleSimulatedTxResult,
        ]
    );

    return {
        initializationError,
        initializeProgram,
        // Instruction
        invokeInstruction,
        isExecuting,
        isProgramLoading,
        lastResult,
        parseLogs,
        preInvocationError,

        program,
        validateInstruction,
    };
}

export const isEnabled = ({
    idl,
    programId,
    publicKey,
    connected,
}: {
    idl: any;
    programId?: PublicKey | string | null;
    publicKey: PublicKey | null;
    connected: boolean;
}): boolean => {
    return Boolean(idl && programId && publicKey && connected === true);
};

function handleInitializeError(error: unknown | Error, message = 'Failed to initialize program') {
    let errorMessage = message;
    if (error instanceof Error) {
        // Provide more specific error messages for common issues
        if (error.message.toLowerCase().includes('wallet')) {
            errorMessage = 'Wallet connection required for program initialization';
        } else if (error.message.toLowerCase().includes('idl')) {
            errorMessage = `IDL error: ${error.message}`;
        } else if (error.message.toLowerCase().includes('program')) {
            errorMessage = `Program error: ${error.message}`;
        } else {
            errorMessage = error.message;
        }
    }
    return errorMessage;
}

/**
 * Result of invoking an instruction.
 * - `{ status: 'success', signature: string, logs: string[], finishedAt: Date }` - Transaction succeeded with signature
 * - `{ status: 'error', message: string | null, logs: string[], serializedTxMessage: string | null, finishedAt: Date }` - Transaction failed; message contains base64-encoded serialized transaction, or null if serialization failed
 * - `null` - No transaction was executed yet
 */
export type InstructionInvocationResult =
    | { status: 'success'; signature: string; logs: string[]; finishedAt: Date }
    | { status: 'error'; message: string; logs: string[]; serializedTxMessage: string | null; finishedAt: Date }
    | null;

function useInvocationState() {
    const [transactionError, setTransactionError] = useState<TransactionError | null>(null);
    const { parseLogs } = useParsedLogs(transactionError);
    const [serializedTxMessage, setSerializedTxMessage] = useState<string | null>(null);

    const [logs, setLogs] = useState<string[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [lastError, setLastError] = useState<{ finishedAt: Date; message: string } | null>(null);
    const [lastSuccess, setLastSuccess] = useState<{ finishedAt: Date; signature: string } | null>(null);

    const handleLogsChange = (logs: string[] | null | undefined) => {
        if (!logs) return;
        setLogs(logs);
    };

    const handleTxStart = () => {
        setIsExecuting(true);
        setLastError(null);
        setLastSuccess(null);
        setLogs([]);
        setTransactionError(null);
        setSerializedTxMessage(null);
    };

    const handleTxSuccess = (signature: string, logs: string[] | null | undefined) => {
        setLastSuccess({ finishedAt: new Date(), signature });
        handleLogsChange(logs);
    };

    const handleTxError = (error: unknown | Error, transaction: Transaction | undefined) => {
        console.error('Instruction execution failed:', { error, transaction });
        const errorMessage = handleInvokeError(error);
        setLastError({ finishedAt: new Date(), message: errorMessage });
        if (error instanceof SendTransactionError) {
            setLogs(error.logs ?? []);
            setTransactionError(error);
        }
        setSerializedTxMessage(serializeTransactionMessage(transaction));
    };

    const handleTxEnd = () => {
        setIsExecuting(false);
    };

    const handleSimulatedTxResult = (simulatedTx: RpcResponseAndContext<SimulatedTransactionResponse>) => {
        if (simulatedTx.value.err !== null) {
            handleLogsChange(simulatedTx.value.logs);
            let errorMessage;
            if (typeof simulatedTx.value.err === 'string') {
                errorMessage = simulatedTx.value.err;
            }
            throw new Error(errorMessage ?? 'Could not simulate transaction');
        }
    };

    const lastResult: InstructionInvocationResult = (() => {
        if (lastSuccess) {
            return {
                finishedAt: lastSuccess.finishedAt,
                logs: logs,
                signature: lastSuccess.signature,
                status: 'success',
            };
        }
        if (lastError) {
            return {
                finishedAt: lastError.finishedAt,
                logs: logs,
                message: lastError.message,
                serializedTxMessage,
                status: 'error',
            };
        }
        return null;
    })();

    return {
        handleSimulatedTxResult,

        handleTxEnd,
        handleTxError,
        handleTxStart,
        handleTxSuccess,

        isExecuting,

        lastResult,

        parseLogs,
    };
}

function handleInvokeError(error: unknown | Error, message = 'Failed to invoke instruction') {
    let errorMessage = message;
    if (error instanceof Error) {
        if (error.message.toLowerCase().includes('simulation failed')) {
            errorMessage = 'Simulation failed. See logs for details.';
        } else {
            errorMessage = error.message;
        }
    }
    return errorMessage;
}

function serializeTransactionMessage(transaction: Transaction | undefined): string | null {
    if (!transaction) return null;
    try {
        return Buffer.from(transaction.serializeMessage()).toString('base64');
    } catch (error) {
        console.warn('Failed to serialize transaction message:', error);
        return null;
    }
}
