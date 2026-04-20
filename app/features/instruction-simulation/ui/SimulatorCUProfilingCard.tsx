import { CUProfilingCard, formatInstructionLogs } from '@entities/compute-unit';
import { useCluster } from '@providers/cluster';
import type { VersionedMessage } from '@solana/web3.js';
import type { InstructionLogs } from '@utils/program-logs';
import { useMemo } from 'react';

type SimulatorCUProfilingCardProps = {
    message: VersionedMessage;
    logs: Array<InstructionLogs>;
    unitsConsumed?: number;
    cluster: ReturnType<typeof useCluster>['cluster'];
    epoch: bigint;
};

export function SimulatorCUProfilingCard({
    message,
    logs,
    unitsConsumed,
    cluster,
    epoch,
}: SimulatorCUProfilingCardProps) {
    const instructionsForCU = useMemo(() => {
        const instructions = message.compiledInstructions.map(ix => ({
            programId: message.staticAccountKeys[ix.programIdIndex],
        }));

        return formatInstructionLogs({
            cluster,
            epoch,
            instructionLogs: logs,
            instructions,
        });
    }, [message, logs, cluster, epoch]);

    return <CUProfilingCard instructions={instructionsForCU} unitsConsumed={unitsConsumed} />;
}
