import 'client-only';

import { type LogRow, toInstructionLogRows } from '@entities/program-logs';
import { useCluster } from '@providers/cluster';
import { useMemo } from 'react';

import type { SimulationResult } from '../lib/simulate-transaction';
import type { SimulationInstructionNames } from './use-simulation-instruction-names';

/** Returns the rows of the Logs card, or `undefined` when the simulation has nothing to show there. */
export function useSimulationLogRows(
    result: SimulationResult | undefined,
    { instructions, unresolvable }: SimulationInstructionNames,
): LogRow[] | undefined {
    const { cluster } = useCluster();
    const logs = result?.logs;
    const error = result?.instructionError;

    return useMemo(() => {
        if (!logs || (logs.invocations.length === 0 && !error)) return undefined;

        return toInstructionLogRows({ cluster, error, instructions: unresolvable ? undefined : instructions, logs });
    }, [cluster, error, instructions, logs, unresolvable]);
}
