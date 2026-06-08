import { baseLogs, errorLogs } from '@entities/program-logs/model/mocks/logs';
import { parsedBaseLogs, parsedErrorLogs } from '@entities/program-logs/model/mocks/parsedLogs';
import type { Meta, StoryObj } from '@storybook/react';
import { withCluster } from '@storybook-config/decorators';

import { InstructionExecutionActivity } from '../InstructionActivity';

const FINISHED_AT = new Date('2026-01-01T00:00:00Z');
const SIGNATURE = '5Qg2cXabc123signaturePlaceholderForStorybookRenderingABCDEFGHJKLMN';
const SERIALIZED = 'AQABAgIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAh';
const LONG_ERROR =
    'Transaction simulation failed: Error processing Instruction 0: custom program error: 0x1771. ' +
    'Program log: AnchorError occurred. Error Code: ConstraintHasOne. Error Number: 2001. ' +
    'Error Message: A has one constraint was violated. The provided account does not match the expected owner.';

const meta = {
    component: InstructionExecutionActivity,
    decorators: [withCluster],
    globals: { viewport: { value: 'responsive' } },
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Interactive IDL/InstructionExecutionActivity',
} satisfies Meta<typeof InstructionExecutionActivity>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No result yet — only the empty Program logs tab renders. */
export const Empty: Story = {
    args: {
        parseLogs: () => [],
    },
};

/** Successful execution — Success status header with a tx link. */
export const Success: Story = {
    args: {
        lastResult: {
            finishedAt: FINISHED_AT,
            logs: baseLogs,
            signature: SIGNATURE,
            status: 'success',
        },
        parseLogs: () => parsedBaseLogs,
    },
};

/** Tx was broadcast but failed on-chain — Error status header with a tx link. */
export const BroadcastFailed: Story = {
    args: {
        lastResult: {
            finishedAt: FINISHED_AT,
            logs: errorLogs,
            message: 'AnchorError occurred. Error Code: ConstraintHasOne. Error Number: 2001.',
            phase: 'broadcast_failed',
            serializedTxMessage: SERIALIZED,
            signature: SIGNATURE,
            status: 'error',
        },
        parseLogs: () => parsedErrorLogs,
    },
};

export const BroadcastFailedEmptyMessage: Story = {
    args: {
        lastResult: {
            finishedAt: FINISHED_AT,
            logs: errorLogs,
            message: '',
            phase: 'broadcast_failed',
            serializedTxMessage: SERIALIZED,
            signature: SIGNATURE,
            status: 'error',
        },
        parseLogs: () => parsedErrorLogs,
    },
};

/** Long error message — the note wraps below the signature box. */
export const BroadcastFailedLongError: Story = {
    args: {
        lastResult: {
            finishedAt: FINISHED_AT,
            logs: errorLogs,
            message: LONG_ERROR,
            phase: 'broadcast_failed',
            serializedTxMessage: SERIALIZED,
            signature: SIGNATURE,
            status: 'error',
        },
        parseLogs: () => parsedErrorLogs,
    },
};

/** Local failure before broadcast, with a serialized message — error note + inspector link. */
export const PreBroadcastFailedWithInspector: Story = {
    args: {
        lastResult: {
            finishedAt: FINISHED_AT,
            logs: errorLogs,
            message: 'Wallet rejected the transaction',
            phase: 'pre_broadcast_failed',
            serializedTxMessage: SERIALIZED,
            status: 'error',
        },
        parseLogs: () => parsedErrorLogs,
    },
};

/** Local failure before a tx could be built — error note, no link. */
export const PreBroadcastFailedNoLink: Story = {
    args: {
        lastResult: {
            finishedAt: FINISHED_AT,
            logs: errorLogs,
            message: 'Failed to build transaction',
            phase: 'pre_broadcast_failed',
            serializedTxMessage: undefined,
            status: 'error',
        },
        parseLogs: () => parsedErrorLogs,
    },
};
