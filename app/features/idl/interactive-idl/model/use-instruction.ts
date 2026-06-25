'use client';

import { getIdlSpecType, type InstructionData } from '@entities/idl';
import { useWallet } from '@solana/wallet-adapter-react';
import {
    type Commitment,
    Connection,
    type Finality,
    PublicKey,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useCluster } from '@/app/providers/cluster';
import { Logger } from '@/app/shared/lib/logger';
import { clusterUrl } from '@/app/utils/cluster';

import { programAtom } from '../model/state-atoms';
import { AnchorInterpreter } from './anchor/anchor-interpreter';
import { CodamaInterpreter } from './codama/codama-interpreter';
import { IdlExecutor, populateAccounts, populateArguments } from './idl-executor';
import type { ExecutionOptions, InstructionExecutionResult, InstructionSimulationResult } from './transaction/types';
import { useExecuteTransaction } from './transaction/use-execute-transaction';
import { useSimulateTransaction } from './transaction/use-simulate-transaction';
import type { UnifiedProgram, UnifiedWallet } from './unified-program';
import { BaseIdl } from './unified-program';

export type { InstructionExecutionResult } from './transaction/types';

type InstructionParams = {
    accounts: Record<string, string>;
    arguments: Record<string, string>;
};

interface UseInstructionOptions {
    programId?: string;
    cluster?: string;
    idl?: BaseIdl;
    enabled?: boolean;
    interpreterName?: typeof AnchorInterpreter.NAME | typeof CodamaInterpreter.NAME;
    commitment?: Finality;
    /** Commitment level for transaction simulation. Defaults to 'processed'. */
    simulationCommitment?: Commitment;
    onSuccess?: (signature: string) => void;
    onError?: (error: string, signature?: string) => void;
}

interface UseInstructionReturn {
    // Execution
    executeInstruction: (
        instructionName: string,
        instruction: InstructionData,
        params: InstructionParams,
        options?: ExecutionOptions,
    ) => Promise<void>;

    // Simulation
    simulateInstruction: (
        instructionName: string,
        instruction: InstructionData,
        params: InstructionParams,
    ) => Promise<void>;

    // Status
    isExecuting: boolean;
    isSimulating: boolean;
    lastResult: InstructionExecutionResult | undefined;
    lastSimulation: InstructionSimulationResult | undefined;
    parseLogs: ReturnType<typeof useExecuteTransaction>['parseLogs'];
    parseSimulationLogs: ReturnType<typeof useSimulateTransaction>['parseLogs'];
    initializeProgram: () => void;
    isProgramLoading: boolean;
    program: UnifiedProgram | undefined;
    initializationError: string | undefined;
}

export function useInstruction({
    programId: pid,
    cluster,
    idl,
    enabled = true,
    interpreterName: interpreterNameOverride,
    commitment = 'confirmed',
    simulationCommitment = 'processed',
    onSuccess,
    onError,
}: UseInstructionOptions): UseInstructionReturn {
    const interpreterName = interpreterNameOverride ?? detectInterpreterName(idl);
    const { publicKey, ...wallet } = useWallet();
    const { cluster: currentCluster, customUrl } = useCluster();

    const [initializationError, setInitializationError] = useState<string>();
    const [isProgramLoading, setIsProgramLoading] = useState(false);
    const [program, setProgram] = useAtom(programAtom);

    const programId = useMemo(() => (pid ? new PublicKey(pid) : undefined), [pid]);

    // Get connection for the specified cluster
    const connection = useMemo(() => {
        const endpoint = cluster || clusterUrl(currentCluster, customUrl);
        return new Connection(endpoint);
    }, [cluster, currentCluster, customUrl]);

    /// Allow to create Executor instance and update cluster-dependent connection
    const executorRef = useRef<IdlExecutor>(undefined);
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
        setInitializationError(undefined);

        try {
            const p = await executor.initializeProgram(idl, programId, unifiedWallet, interpreterName);
            setProgram(p);
            setInitializationError(undefined);
        } catch (error) {
            Logger.error(error, {
                context: 'initializeProgram',
                interpreterName,
                programId: programId.toString(),
            });
            setInitializationError(handleInitializeError(error));
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
                setInitializationError(undefined);
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
            setInitializationError(undefined);
            initKeyRef.current = '';
        }
    }, [idl, programId?.toString()]); // eslint-disable-line react-hooks/exhaustive-deps

    const { executeTx, isExecuting, lastResult, parseLogs } = useExecuteTransaction({
        commitment,
        connection,
        idlErrors: idl?.errors,
        onError,
        onSuccess,
    });

    const {
        isSimulating,
        lastSimulation,
        parseLogs: parseSimulationLogs,
        simulate,
    } = useSimulateTransaction({
        connection,
        idlErrors: idl?.errors,
        simulationCommitment,
    });

    // Transaction builder for instruction execution and simulation.
    const makeTxBuilder = useCallback(
        (instructionName: string, params: InstructionParams) => async () => {
            if (!idl || !program || !publicKey) {
                throw new Error('Program / IDL / wallet not ready');
            }
            const ix = await executor.getInstruction(
                program,
                instructionName,
                populateAccounts(params.accounts, instructionName),
                populateArguments(params.arguments, instructionName),
                idl,
                interpreterName,
            );
            if (!(ix instanceof TransactionInstruction)) {
                throw new Error('Unsupported instruction format');
            }
            const tx = new Transaction().add(ix);
            tx.feePayer = publicKey;
            return tx;
        },
        [idl, program, publicKey, executor, interpreterName],
    );

    const executeInstruction = useCallback(
        (
            instructionName: string,
            _instruction: InstructionData,
            params: InstructionParams,
            options?: ExecutionOptions,
        ): Promise<void> => executeTx(makeTxBuilder(instructionName, params), options),
        [executeTx, makeTxBuilder],
    );

    const simulateInstruction = useCallback(
        (instructionName: string, _instruction: InstructionData, params: InstructionParams): Promise<void> =>
            simulate(makeTxBuilder(instructionName, params)),
        [simulate, makeTxBuilder],
    );

    return {
        executeInstruction,
        initializationError,
        initializeProgram,
        isExecuting,
        isProgramLoading,
        isSimulating,
        lastResult,
        lastSimulation,
        parseLogs,
        parseSimulationLogs,
        program,
        simulateInstruction,
    };
}

export const isEnabled = ({
    idl,
    programId,
    publicKey,
    connected,
}: {
    idl: unknown;
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
 * Auto-detect the interpreter name based on the IDL type.
 * Falls back to Anchor interpreter for unknown/missing IDLs.
 */
function detectInterpreterName(idl?: BaseIdl): typeof AnchorInterpreter.NAME | typeof CodamaInterpreter.NAME {
    if (idl && getIdlSpecType(idl) === 'codama') {
        return CodamaInterpreter.NAME;
    }
    return AnchorInterpreter.NAME;
}
