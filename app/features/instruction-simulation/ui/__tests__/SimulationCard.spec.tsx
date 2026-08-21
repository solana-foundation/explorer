import type { VersionedMessage } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { useSimulation, useSimulationInstructionNames, CUProfilingCard } = vi.hoisted(() => ({
    CUProfilingCard: vi.fn(() => null),
    useSimulation: vi.fn(),
    useSimulationInstructionNames: vi.fn(),
}));

vi.mock('../../model/use-simulation', () => ({ useSimulation }));
vi.mock('../../model/use-simulation-instruction-names', () => ({ useSimulationInstructionNames }));
vi.mock('../BaseSimulatorCUProfilingCard', () => ({ BaseSimulatorCUProfilingCard: CUProfilingCard }));
vi.mock('../SolBalanceChangesCard', () => ({ SolBalanceChangesCard: () => null }));
vi.mock('@components/ProgramLogsCardBody', () => ({ ProgramLogsCardBody: () => null }));
vi.mock('@features/transaction', () => ({
    TokenBalancesCardInner: () => null,
    generateTokenBalanceRows: () => [],
}));
vi.mock('@providers/cluster', () => ({
    useCluster: () => ({ cluster: Cluster.MainnetBeta, url: 'https://api.mainnet-beta.solana.com' }),
}));

import { SimulatorCard } from '../SimulationCard';

const UNAVAILABLE = 'Unavailable: an instruction referenced an account this message does not resolve.';
const MESSAGE = { compiledInstructions: [] } as unknown as VersionedMessage;

beforeEach(() => {
    useSimulation.mockReturnValue({
        result: {
            accountKeys: [],
            epoch: 0n,
            error: undefined,
            logs: [{ computeUnits: 105, failed: false, invokedProgram: 'TokenProgram', logs: [] }],
            solBalanceChanges: [],
            unitsConsumed: 105,
        },
        simulate: vi.fn(),
        status: 'done',
    });
    useSimulationInstructionNames.mockReturnValue({ instructions: [], unresolvable: false });
});

afterEach(() => vi.clearAllMocks());

/**
 * A simulation that produced logs owes the user a CU card. Rendering nothing leaves logs with no chart
 * beside them, and no way to tell a broken message from a missing feature.
 */
describe('SimulatorCard CU profiling', () => {
    it('should say why CU profiling is unavailable when the message cannot be named', () => {
        useSimulationInstructionNames.mockReturnValue({ instructions: [], unresolvable: true });

        render(<SimulatorCard message={MESSAGE} showTokenBalanceChanges={false} />);

        expect(screen.getByText(UNAVAILABLE)).toBeInTheDocument();
        expect(CUProfilingCard).not.toHaveBeenCalled();
    });

    it('should render the chart when the rows resolved', () => {
        useSimulationInstructionNames.mockReturnValue({
            instructions: [{ name: 'Transfer Checked', programId: { toBase58: () => 'TokenProgram' } }],
            unresolvable: false,
        });

        render(<SimulatorCard message={MESSAGE} showTokenBalanceChanges={false} />);

        expect(CUProfilingCard).toHaveBeenCalled();
        expect(screen.queryByText(UNAVAILABLE)).not.toBeInTheDocument();
    });

    // No logs means nothing to profile, so neither the chart nor an excuse belongs on the page.
    it('should render neither the chart nor a reason when the simulation produced no logs', () => {
        useSimulation.mockReturnValue({
            result: { accountKeys: [], epoch: 0n, error: 'blockhash not found', logs: undefined },
            simulate: vi.fn(),
            status: 'done',
        });
        useSimulationInstructionNames.mockReturnValue({ instructions: [], unresolvable: true });

        render(<SimulatorCard message={MESSAGE} showTokenBalanceChanges={false} />);

        expect(screen.queryByText(UNAVAILABLE)).not.toBeInTheDocument();
        expect(CUProfilingCard).not.toHaveBeenCalled();
    });

    // `parseProgramLogs` returns [] for a simulation that logged nothing, and an empty array is truthy —
    // so guarding on the array itself put the "unavailable" excuse on a page with nothing to profile.
    it('should render neither the chart nor a reason when the log list is empty', () => {
        useSimulation.mockReturnValue({
            result: { accountKeys: [], epoch: 0n, error: undefined, logs: [] },
            simulate: vi.fn(),
            status: 'done',
        });
        useSimulationInstructionNames.mockReturnValue({ instructions: [], unresolvable: true });

        render(<SimulatorCard message={MESSAGE} showTokenBalanceChanges={false} />);

        expect(screen.queryByText(UNAVAILABLE)).not.toBeInTheDocument();
        expect(CUProfilingCard).not.toHaveBeenCalled();
    });
});
