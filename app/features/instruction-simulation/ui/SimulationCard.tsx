import { ProgramLogsCardBody } from '@components/ProgramLogsCardBody';
import { TokenBalancesCardInner } from '@components/transaction/TokenBalancesCard';
import { useCluster } from '@providers/cluster';
import type { VersionedMessage } from '@solana/web3.js';
import React from 'react';

import { useSimulation } from '../model/use-simulation';
import { SimulatorCUProfilingCard } from './SimulatorCUProfilingCard';
import { SolBalanceChangesCard } from './SolBalanceChangesCard';

type SimulatorCardProps = {
    message: VersionedMessage;
    showTokenBalanceChanges: boolean;
    accountBalances?: {
        preBalances: number[];
        postBalances: number[];
    };
};

export function SimulatorCard({ message, showTokenBalanceChanges, accountBalances }: SimulatorCardProps) {
    const { cluster, url } = useCluster();
    const {
        simulate,
        simulating,
        simulationEpoch,
        simulationLogs: logs,
        simulationError,
        simulationTokenBalanceRows,
        simulationSolBalanceChanges,
        simulationUnitsConsumed,
    } = useSimulation(message, accountBalances);

    if (simulating) {
        return (
            <div className="card">
                <div className="card-header">
                    <h3 className="card-header-title">Transaction Simulation</h3>
                </div>
                <div className="card-body e-text-center">
                    <span className="spinner-grow spinner-grow-sm e-mr-2"></span>
                    Simulating
                </div>
            </div>
        );
    } else if (!logs) {
        return (
            <div className="card">
                <div className="card-header">
                    <h3 className="card-header-title">Transaction Simulation</h3>
                    <button className="btn btn-sm d-flex btn-white" onClick={simulate}>
                        {simulationError ? 'Retry' : 'Simulate'}
                    </button>
                </div>
                <div className="card-body">
                    {simulationError ? (
                        <div>
                            Simulation Failure:
                            <span className="e-ml-2 e-text-yellow-500">{simulationError}</span>
                        </div>
                    ) : (
                        <ul className="e-list-disc e-space-y-2 e-pl-5 e-text-neutral-500">
                            <li>
                                Simulation is free and will run this transaction against the latest confirmed ledger
                                state.
                            </li>
                            <li>No state changes will be persisted and all signature checks will be disabled.</li>
                        </ul>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <h3 className="card-header-title">Transaction Simulation</h3>
                    <button className="btn btn-sm d-flex btn-white" onClick={simulate}>
                        Retry
                    </button>
                </div>
                <ProgramLogsCardBody message={message} logs={logs} cluster={cluster} url={url} />
            </div>
            {simulationEpoch !== undefined && (
                <SimulatorCUProfilingCard
                    message={message}
                    logs={logs}
                    unitsConsumed={simulationUnitsConsumed}
                    cluster={cluster}
                    epoch={simulationEpoch}
                />
            )}
            {simulationSolBalanceChanges && !simulationError && simulationSolBalanceChanges.length > 0 && (
                <SolBalanceChangesCard balanceChanges={simulationSolBalanceChanges} />
            )}
            {showTokenBalanceChanges &&
            simulationTokenBalanceRows &&
            !simulationError &&
            simulationTokenBalanceRows.rows.length ? (
                <TokenBalancesCardInner rows={simulationTokenBalanceRows.rows} />
            ) : null}
        </>
    );
}
