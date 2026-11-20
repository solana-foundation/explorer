import { BaseCUProfilingCard, toInstructionCUData } from '@entities/compute-unit';
import type { Invocation } from '@entities/program-logs';
import type { NamedInstruction } from '@entities/transaction-data';
import { useMemo } from 'react';

type BaseSimulatorCUProfilingCardProps = {
    /** One row per instruction, in `compiledInstructions` order — see useSimulationInstructionNames. */
    instructions: NamedInstruction[];
    /** The top-level invocations of the simulation's logs. */
    invocations: readonly Invocation[];
    unitsConsumed?: number;
    /**
     * Render only the chart + legend body, without the built-in card chrome/header, so a caller can supply
     * its own section header (e.g. the inspector's header-outside layout). Defaults to false.
     */
    headerless?: boolean;
};

export function BaseSimulatorCUProfilingCard({
    instructions,
    invocations,
    unitsConsumed,
    headerless = false,
}: BaseSimulatorCUProfilingCardProps) {
    const instructionsForCU = useMemo(
        () => toInstructionCUData({ instructions, invocations }),
        [instructions, invocations],
    );

    return (
        <BaseCUProfilingCard instructions={instructionsForCU} unitsConsumed={unitsConsumed} headerless={headerless} />
    );
}
