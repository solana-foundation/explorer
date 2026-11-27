import { DEFAULT_RPC_URL, gen } from '@__fixtures__/gen';
import { parseProgramLogs } from '@entities/program-logs';
import type { VersionedMessage } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { describe, expect, it, vi } from 'vitest';

import type { SimulationResult } from '@/app/features/instruction-simulation/lib/simulate-transaction';
import type { SimulationState } from '@/app/features/instruction-simulation/model/use-simulation';

vi.mock('@entities/program-logs', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/program-logs')>()),
    ProgramLogs: () => <div data-testid="program-logs" />,
}));
vi.mock('@/app/features/instruction-simulation/ui/BaseSimulatorCUProfilingCard', () => ({
    BaseSimulatorCUProfilingCard: () => <div data-testid="cu-profiling" />,
}));
vi.mock('@/app/features/instruction-simulation/model/use-simulation-instruction-names', () => ({
    useSimulationInstructionNames: () => ({ instructions: [], unresolvable: false }),
}));
vi.mock('@providers/cluster', () => ({
    useCluster: () => ({ cluster: Cluster.Devnet, url: DEFAULT_RPC_URL }),
}));

import { InspectorSimulationPanel } from '../InspectorSimulationPanel';

const MESSAGE = { compiledInstructions: [] } as unknown as VersionedMessage;
const NO_LOGS_HINT = 'The simulation produced no logs.';

const PROGRAM_ADDRESS = gen.address();

const FAILED_PROGRAM_LOGS = parseProgramLogs([
    `Program ${PROGRAM_ADDRESS} invoke [1]`,
    `Program ${PROGRAM_ADDRESS} failed: custom program error: 0x1771`,
]);

const SUCCEEDED_PROGRAM_LOGS = parseProgramLogs([
    `Program ${PROGRAM_ADDRESS} invoke [1]`,
    `Program ${PROGRAM_ADDRESS} success`,
]);

describe('inspector::InspectorSimulationPanel', () => {
    it('should show the failure reason when the simulation returns no logs', () => {
        renderPanel(createSimulationStateDone({ error: 'InvalidAccountForFee', logs: undefined }));

        expect(screen.getByText('Simulation Failure:')).toBeInTheDocument();
        expect(screen.getByText('InvalidAccountForFee')).toBeInTheDocument();
    });

    it('should point at the logs when a program fails during the simulation', () => {
        renderPanel(
            createSimulationStateDone({
                error: '{"InstructionError":[0,{"Custom":6001}]}',
                instructionError: { index: 0, message: 'custom program error: 0x1771' },
                logs: FAILED_PROGRAM_LOGS,
            }),
        );

        // eslint-disable-next-line no-restricted-syntax -- the failure text continues past this prefix
        expect(screen.getByText(/Transaction reverted during simulation/)).toBeInTheDocument();
        expect(screen.getByTestId('program-logs')).toBeInTheDocument();
        expect(screen.getByTestId('cu-profiling')).toBeInTheDocument();
        expect(screen.queryByText(NO_LOGS_HINT)).not.toBeInTheDocument();
    });

    it('should show the failure reason when the transaction error names no instruction', () => {
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

    it('should display the message with empty logs and CU profiling after a simulation with no logs', () => {
        renderPanel(createSimulationStateDone({ error: 'InvalidAccountForFee', logs: undefined }));

        expect(screen.getAllByText(NO_LOGS_HINT)).toHaveLength(2);
        // eslint-disable-next-line no-restricted-syntax -- one pattern covers the logs and CU profiling placeholders
        expect(screen.queryByText(/Run the simulation to view/)).not.toBeInTheDocument();
    });

    it('should display default message to run the simulation before the first run', () => {
        renderPanel({ simulate: vi.fn(), status: 'idle' });

        expect(screen.getByText('Run the simulation to view the program logs.')).toBeInTheDocument();
        expect(screen.getByText('Run the simulation to view CU profiling.')).toBeInTheDocument();
        expect(screen.queryByText(NO_LOGS_HINT)).not.toBeInTheDocument();
    });
});

function renderPanel(simulation: SimulationState) {
    return render(<InspectorSimulationPanel simulation={simulation} message={MESSAGE} />);
}

function createSimulationStateDone(
    overrides: Pick<SimulationResult, 'error' | 'logs'> & Partial<Pick<SimulationResult, 'instructionError'>>,
): SimulationState {
    return {
        result: {
            accountKeys: [],
            instructionError: undefined,
            outcome: overrides.error
                ? { failedInstructionIndex: overrides.instructionError?.index, status: 'failed' }
                : { status: 'succeeded' },
            solBalanceChanges: undefined,
            tokenBalanceData: undefined,
            unitsConsumed: undefined,
            ...overrides,
        },
        simulate: vi.fn(),
        status: 'done',
    };
}
