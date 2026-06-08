import { baseLogs, errorLogs } from '@entities/program-logs/model/mocks/logs';
import { parsedBaseLogs, parsedErrorLogs } from '@entities/program-logs/model/mocks/parsedLogs';
import type { Meta, StoryObj } from '@storybook/react';
import { withCluster } from '@storybook-config/decorators';

import { InstructionSimulationActivity } from '../InstructionActivity';

const FINISHED_AT = new Date('2026-01-01T00:00:00Z');
const SERIALIZED = 'AQABAgIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAh';
const LONG_ERROR =
    'Transaction simulation failed: Error processing Instruction 0: custom program error: 0x1771. ' +
    'Program log: AnchorError occurred. Error Code: ConstraintHasOne. Error Number: 2001. ' +
    'Error Message: A has one constraint was violated. The provided account does not match the expected owner.';

const meta = {
    component: InstructionSimulationActivity,
    decorators: [withCluster],
    globals: { viewport: { value: 'responsive' } },
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Interactive IDL/InstructionSimulationActivity',
} satisfies Meta<typeof InstructionSimulationActivity>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No simulation yet — only the empty Program logs tab renders. */
export const Empty: Story = {
    args: {
        parseLogs: () => [],
    },
};

/** Successful simulation — Simulated status header with compute units and inspector link. */
export const Success: Story = {
    args: {
        lastSimulation: {
            finishedAt: FINISHED_AT,
            logs: baseLogs,
            returnData: undefined,
            serializedTxMessage: SERIALIZED,
            status: 'success',
            unitsConsumed: 7617,
        },
        parseLogs: () => parsedBaseLogs,
    },
};

export const RpcSimulationFailed: Story = {
    args: {
        lastSimulation: {
            finishedAt: FINISHED_AT,
            logs: errorLogs,
            message:
                'Error Message: A has one constraint was violated. The provided account does not match the expected owner.',
            phase: 'rpc_simulation_failed',
            serializedTxMessage: SERIALIZED,
            status: 'error',
        },
        parseLogs: () => parsedErrorLogs,
    },
};

export const RpcSimulationFailedEmptyMessage: Story = {
    args: {
        lastSimulation: {
            finishedAt: FINISHED_AT,
            logs: errorLogs,
            message: '',
            phase: 'rpc_simulation_failed',
            serializedTxMessage: SERIALIZED,
            status: 'error',
        },
        parseLogs: () => parsedErrorLogs,
    },
};

export const RpcSimulationFailedLongError: Story = {
    args: {
        lastSimulation: {
            finishedAt: FINISHED_AT,
            logs: errorLogs,
            message: LONG_ERROR,
            phase: 'rpc_simulation_failed',
            serializedTxMessage: SERIALIZED,
            status: 'error',
        },
        parseLogs: () => parsedErrorLogs,
    },
};

/** Local failure before/during the simulate call, no serialized message — error note, no link. */
export const ExecutionFailedNoLink: Story = {
    args: {
        lastSimulation: {
            finishedAt: FINISHED_AT,
            message: 'Failed to fetch latest blockhash',
            phase: 'simulation_execution_failed',
            serializedTxMessage: undefined,
            status: 'error',
        },
        parseLogs: () => [],
    },
};
