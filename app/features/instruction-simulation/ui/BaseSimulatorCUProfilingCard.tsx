import { BaseCUProfilingCard, formatInstructionLogs } from '@entities/compute-unit';
import type { InstructionLogs } from '@entities/program-logs';
import type { NamedInstruction } from '@entities/transaction-data';
import { useMemo } from 'react';

type BaseSimulatorCUProfilingCardProps = {
    /** One row per instruction, in `compiledInstructions` order — see useSimulationInstructionNames. */
    instructions: NamedInstruction[];
    logs: Array<InstructionLogs>;
    unitsConsumed?: number;
    /**
     * Render only the chart + legend body, without the built-in card chrome/header, so a caller can supply
     * its own section header (e.g. the inspector's header-outside layout). Defaults to false.
     */
    headerless?: boolean;
};

export function BaseSimulatorCUProfilingCard({
    instructions,
    logs,
    unitsConsumed,
    headerless = false,
}: BaseSimulatorCUProfilingCardProps) {
    const instructionsForCU = useMemo(
        () => formatInstructionLogs({ instructionLogs: logs, instructions }),
        [instructions, logs],
    );

    return (
        <BaseCUProfilingCard instructions={instructionsForCU} unitsConsumed={unitsConsumed} headerless={headerless} />
    );
}
