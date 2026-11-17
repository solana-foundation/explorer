/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { gen } from '@__fixtures__/gen';
import type { VersionedMessage } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import type { InstructionLogs } from '@utils/program-logs';
import { describe, expect, it, vi } from 'vitest';

import type { SimulationResult } from '@/app/features/instruction-simulation/lib/simulate-transaction';
import type { SimulationState } from '@/app/features/instruction-simulation/model/use-simulation';

vi.mock('@/app/components/ProgramLogsCardBody', () => ({
    ProgramLogsCardBody: () => <div data-testid="program-logs" />,
}));
vi.mock('@/app/features/instruction-simulation/ui/BaseSimulatorCUProfilingCard', () => ({
    BaseSimulatorCUProfilingCard: () => <div data-testid="cu-profiling" />,
}));
vi.mock('@/app/features/instruction-simulation/model/use-simulation-instruction-names', () => ({
    useSimulationInstructionNames: () => ({ instructions: [], unresolvable: false }),
}));
vi.mock('@providers/cluster', () => ({
    useCluster: () => ({ cluster: Cluster.Devnet, url: 'https://api.devnet.solana.com' }),
}));

import { InspectorSimulationPanel } from '../InspectorSimulationPanel';

const MESSAGE = { compiledInstructions: [] } as unknown as VersionedMessage;
const NO_LOGS_HINT = 'The simulation produced no logs.';

const FAILED_PROGRAM_LOGS: InstructionLogs[] = [
    {
        computeUnits: 43_950,
        failed: true,
        invokedProgram: gen.address(),
        logs: [{ prefix: '> ', style: 'warning', text: 'Program returned error: "custom program error: 0x1771"' }],
        truncated: false,
    },
];

const SUCCEEDED_PROGRAM_LOGS: InstructionLogs[] = [
    {
        computeUnits: 150,
        failed: false,
        invokedProgram: gen.address(),
        logs: [{ prefix: '> ', style: 'success', text: 'Program returned success' }],
        truncated: false,
    },
];

describe('inspector::InspectorSimulationPanel', () => {
    it('should show the failure reason when the simulation fails before any program runs', () => {
        renderPanel(createSimulationStateDone({ error: 'InvalidAccountForFee', logs: undefined }));

        expect(screen.getByText('Simulation Failure:')).toBeInTheDocument();
        expect(screen.getByText('InvalidAccountForFee')).toBeInTheDocument();
    });

    it('should point at the logs when a program fails during the simulation', () => {
        renderPanel(
            createSimulationStateDone({ error: '{"InstructionError":[0,{"Custom":6001}]}', logs: FAILED_PROGRAM_LOGS }),
        );

        expect(screen.getByText(/Transaction reverted during simulation/)).toBeInTheDocument();
        expect(screen.getByTestId('program-logs')).toBeInTheDocument();
        expect(screen.getByTestId('cu-profiling')).toBeInTheDocument();
        expect(screen.queryByText(NO_LOGS_HINT)).not.toBeInTheDocument();
    });

    it('should show the failure reason when the logs mark no failed instruction', () => {
        const reason = '{"InsufficientFundsForRent":{"account_index":2}}';
        renderPanel(createSimulationStateDone({ error: reason, logs: SUCCEEDED_PROGRAM_LOGS }));

        expect(screen.getByText(reason)).toBeInTheDocument();
    });

    it('should show the request error when the simulation request fails', () => {
        renderPanel({ error: 'Failed to fetch', simulate: vi.fn(), status: 'error' });

        expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });

    it('should not show a failure when the simulation succeeds', () => {
        renderPanel(createSimulationStateDone({ error: undefined, logs: SUCCEEDED_PROGRAM_LOGS }));

        expect(screen.queryByText('Simulation Failure:')).not.toBeInTheDocument();
    });

    it.each([
        { logs: undefined, name: 'no log list' },
        { logs: [], name: 'an empty log list' },
    ])('should say the logs and CU profiling are empty after a run with $name', ({ logs }) => {
        renderPanel(createSimulationStateDone({ error: 'InvalidAccountForFee', logs }));

        expect(screen.getAllByText(NO_LOGS_HINT)).toHaveLength(2);
        expect(screen.queryByText(/Run the simulation to view/)).not.toBeInTheDocument();
    });

    it('should ask to run the simulation before the first run', () => {
        renderPanel({ simulate: vi.fn(), status: 'idle' });

        expect(screen.getByText('Run the simulation to view the program logs.')).toBeInTheDocument();
        expect(screen.getByText('Run the simulation to view CU profiling.')).toBeInTheDocument();
        expect(screen.queryByText(NO_LOGS_HINT)).not.toBeInTheDocument();
    });
});

function renderPanel(simulation: SimulationState) {
    return render(<InspectorSimulationPanel simulation={simulation} message={MESSAGE} />);
}

function createSimulationStateDone(overrides: Pick<SimulationResult, 'error' | 'logs'>): SimulationState {
    return {
        result: {
            accountKeys: [],
            epoch: 0n,
            solBalanceChanges: undefined,
            tokenBalanceData: undefined,
            unitsConsumed: undefined,
            ...overrides,
        },
        simulate: vi.fn(),
        status: 'done',
    };
}
