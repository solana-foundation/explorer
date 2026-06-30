'use client';

import { type Commitment, type Connection, type Transaction, VersionedTransaction } from '@solana/web3.js';
import { useCallback, useState } from 'react';

import { useCluster } from '@/app/providers/cluster';
import { Logger } from '@/app/shared/lib/logger';

import type { BaseIdl } from '../unified-program';
import { formatTransactionError } from './format-transaction-error';
import { toResultLogs } from './parse-result-logs';
import { toBase64TransactionMessage } from './serialize-transaction-message';
import type { InstructionSimulationResult } from './types';

export function useSimulateTransaction(opts: {
    connection: Connection;
    simulationCommitment: Commitment;
    idlErrors?: BaseIdl['errors'];
}) {
    const { connection, simulationCommitment, idlErrors } = opts;
    const { cluster } = useCluster();
    const [isSimulating, setIsSimulating] = useState(false);
    const [lastSimulation, setLastSimulation] = useState<InstructionSimulationResult>();

    const simulate = useCallback(
        async (buildTx: () => Promise<Transaction>): Promise<void> => {
            setIsSimulating(true);
            setLastSimulation(undefined);
            let transaction: Transaction | undefined;
            let serializedTxMessage: string | undefined = undefined;
            try {
                // Build transaction
                transaction = await buildTx();
                if (!transaction.recentBlockhash) {
                    const { blockhash } = await connection.getLatestBlockhash();
                    transaction.recentBlockhash = blockhash;
                }

                // Serialize to Base64 for rendering and inspector url
                serializedTxMessage = toBase64TransactionMessage(transaction);

                // Simulate
                const result = await connection.simulateTransaction(
                    new VersionedTransaction(transaction.compileMessage()),
                    {
                        commitment: simulationCommitment,
                    },
                );

                // Handle simulation result
                const logs = result.value.logs ?? [];
                if (result.value.err !== null) {
                    setLastSimulation({
                        finishedAt: new Date(),
                        kind: 'simulation',
                        logs: toResultLogs(logs, result.value.err, cluster),
                        message: formatTransactionError(result.value.err, idlErrors),
                        phase: 'rpc_simulation_failed',
                        serializedTxMessage,
                        status: 'error',
                    });
                    return;
                }
                setLastSimulation({
                    finishedAt: new Date(),
                    kind: 'simulation',
                    logs: toResultLogs(logs, undefined, cluster),
                    returnData: result.value.returnData ?? undefined,
                    serializedTxMessage,
                    status: 'success',
                    unitsConsumed: result.value.unitsConsumed,
                });
            } catch (e) {
                Logger.error(e, { transaction });
                setLastSimulation({
                    finishedAt: new Date(),
                    kind: 'simulation',
                    message: e instanceof Error ? e.message : 'Simulation failed',
                    phase: 'simulation_execution_failed',
                    serializedTxMessage,
                    status: 'error',
                });
            } finally {
                setIsSimulating(false);
            }
        },
        [connection, simulationCommitment, idlErrors, cluster],
    );

    return { isSimulating, lastSimulation, simulate };
}
