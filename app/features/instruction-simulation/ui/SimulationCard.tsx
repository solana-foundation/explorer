import { ProgramLogsCardBody } from '@components/ProgramLogsCardBody';
import { generateTokenBalanceRows, TokenBalancesCardInner } from '@features/transaction';
import { useCluster } from '@providers/cluster';
import type { VersionedMessage } from '@solana/web3.js';
import React, { useMemo } from 'react';

import { Button } from '@/app/components/shared/ui/button';
import { CollapsibleCard } from '@/app/components/shared/ui/collapsible-card';
import { baseCardVariants, Card, CardBody, CardHeader, CardTitle } from '@/app/shared/ui/Card';

import { useSimulation } from '../model/use-simulation';
import { useSimulationInstructionNames } from '../model/use-simulation-instruction-names';
import { BaseSimulatorCUProfilingCard } from './BaseSimulatorCUProfilingCard';
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
    // Lookup-table-resolved keys only exist once the simulation has run, so naming waits for them.
    const { instructions: namedInstructions, unresolvable } = useSimulationInstructionNames({
        accountKeys: simulation.status === 'done' ? simulation.result.accountKeys : undefined,
        message,
    });

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
                <CardBody ui="dashkit" className="text-center">
                    <span className="spinner-grow spinner-grow-sm mr-2"></span>
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
                        <span className="ml-2 text-yellow-500">{simulation.error}</span>
                    </div>
                </CardBody>
            </SimulationCardShell>
        );
    }

    if (simulation.status === 'idle') {
        return (
            <SimulationCardShell action={<SimulateButton label="Simulate" onClick={simulation.simulate} />}>
                <CardBody ui="dashkit">
                    <ul className="list-disc space-y-2 pl-5 text-neutral-500">
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
                            <span className="ml-2 text-yellow-500">{error}</span>
                        </div>
                    </CardBody>
                )}
            </SimulationCardShell>
            {hasLogs &&
                (unresolvable ? (
                    // Logs exist, so this owes the user a card. Every CU figure would land on the wrong
                    // instruction, so saying why beats drawing it — or vanishing.
                    <CollapsibleCard title="CU profiling" className={baseCardVariants({ ui: 'dashkit' })}>
                        <CardBody ui="dashkit">
                            <div className="text-xs text-muted">
                                Unavailable: an instruction referenced an account this message does not resolve.
                            </div>
                        </CardBody>
                    </CollapsibleCard>
                ) : (
                    <BaseSimulatorCUProfilingCard
                        instructions={namedInstructions}
                        logs={logs}
                        unitsConsumed={unitsConsumed}
                        cluster={cluster}
                        epoch={epoch}
                    />
                ))}
            {succeeded && !!solBalanceChanges?.length && <SolBalanceChangesCard balanceChanges={solBalanceChanges} />}
            {succeeded && showTokenBalanceChanges && !!tokenBalanceRows?.length && (
                <TokenBalancesCardInner rows={tokenBalanceRows} />
            )}
        </>
    );
}

function SimulateButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <Button ui="dashkit" variant="white" size="sm" className="flex" onClick={onClick}>
            {label}
        </Button>
    );
}

function SimulationCardShell({ action, children }: { action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Transaction Simulation
                </CardTitle>
                {action}
            </CardHeader>
            {children}
        </Card>
    );
}
