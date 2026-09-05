import { BaseCUProfilingCard, formatInstructionLogs } from '@entities/compute-unit';
import type { NamedInstruction } from '@entities/transaction-data';
import type { useCluster } from '@providers/cluster';
import type { InstructionLogs } from '@utils/program-logs';
import { useMemo } from 'react';

type BaseSimulatorCUProfilingCardProps = {
    /** One row per instruction, in `compiledInstructions` order — see useSimulationInstructionNames. */
    instructions: NamedInstruction[];
    logs: Array<InstructionLogs>;
    unitsConsumed?: number;
    cluster: ReturnType<typeof useCluster>['cluster'];
    epoch: bigint;
};

export function BaseSimulatorCUProfilingCard({
    instructions,
    logs,
    unitsConsumed,
    cluster,
    epoch,
}: BaseSimulatorCUProfilingCardProps) {
    const instructionsForCU = useMemo(
        () => formatInstructionLogs({ cluster, epoch, instructionLogs: logs, instructions }),
        [instructions, logs, cluster, epoch],
    );

    return <BaseCUProfilingCard instructions={instructionsForCU} unitsConsumed={unitsConsumed} />;
}
