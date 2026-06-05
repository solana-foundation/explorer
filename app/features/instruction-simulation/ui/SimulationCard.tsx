import { ProgramLogsCardBody } from '@components/ProgramLogsCardBody';
import { generateTokenBalanceRows, TokenBalancesCardInner } from '@features/transaction';
import { useCluster } from '@providers/cluster';
import type { VersionedMessage } from '@solana/web3.js';
import React, { useMemo } from 'react';

import { CardBody, CardHeader, CardTitle } from '@/app/shared/ui/Card';

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
    const simulation = useSimulation(message, accountBalances);

    const tokenBalanceData = simulation.status === 'done' ? simulation.result.tokenBalanceData : undefined;
    const tokenBalanceRows = useMemo(
        () =>
            tokenBalanceData
                ? generateTokenBalanceRows(
                      tokenBalanceData.preTokenBalances,
                      tokenBalanceData.postTokenBalances,
                      tokenBalanceData.accountKeys,
                  )
                : undefined,
        [tokenBalanceData],
    );

    if (simulation.status === 'simulating') {
        return (
            <SimulationCardShell>
                <CardBody ui="dashkit" className="e-text-center">
                    <span className="e-spinner-grow e-spinner-grow-sm e-mr-2"></span>
                    Simulating
                </CardBody>
            </SimulationCardShell>
        );
    }

    if (simulation.status === 'error') {
        return (
            <SimulationCardShell action={<SimulateButton label="Retry" onClick={simulation.simulate} />}>
                <CardBody ui="dashkit">
                    <div>
                        Simulation Failure:
                        <span className="e-ml-2 e-text-yellow-500">{simulation.error}</span>
                    </div>
                </CardBody>
            </SimulationCardShell>
        );
    }

    if (simulation.status === 'idle') {
        return (
            <SimulationCardShell action={<SimulateButton label="Simulate" onClick={simulation.simulate} />}>
                <CardBody ui="dashkit">
                    <ul className="e-list-disc e-space-y-2 e-pl-5 e-text-neutral-500">
                        <li>
                            Simulation is free and will run this transaction against the latest confirmed ledger state.
                        </li>
                        <li>No state changes will be persisted and all signature checks will be disabled.</li>
                    </ul>
                </CardBody>
            </SimulationCardShell>
        );
    }

    const { logs, solBalanceChanges, epoch, unitsConsumed, error } = simulation.result;
    const succeeded = !error;
    const hasLogs = !!logs?.length;
    const hasErrorWithoutLogs = !hasLogs && !!error;

    return (
        <>
            <SimulationCardShell action={<SimulateButton label="Retry" onClick={simulation.simulate} />}>
                {hasLogs && <ProgramLogsCardBody message={message} logs={logs} cluster={cluster} url={url} />}
                {hasErrorWithoutLogs && (
                    <CardBody ui="dashkit">
                        <div>
                            Simulation Failure:
                            <span className="e-ml-2 e-text-yellow-500">{error}</span>
                        </div>
                    </CardBody>
                )}
            </SimulationCardShell>
            {logs && (
                <SimulatorCUProfilingCard
                    message={message}
                    logs={logs}
                    unitsConsumed={unitsConsumed}
                    cluster={cluster}
                    epoch={epoch}
                />
            )}
            {succeeded && !!solBalanceChanges?.length && <SolBalanceChangesCard balanceChanges={solBalanceChanges} />}
            {succeeded && showTokenBalanceChanges && !!tokenBalanceRows?.length && (
                <TokenBalancesCardInner rows={tokenBalanceRows} />
            )}
        </>
    );
}

function SimulateButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button className="btn btn-sm btn-white e-flex" onClick={onClick}>
            {label}
        </button>
    );
}

function SimulationCardShell({ action, children }: { action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="card">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Transaction Simulation
                </CardTitle>
                {action}
            </CardHeader>
            {children}
        </div>
    );
}
