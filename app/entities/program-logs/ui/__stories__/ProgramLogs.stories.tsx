import { PublicKey } from '@solana/web3.js';
import { nextjsParameters } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { Cluster } from '@utils/cluster';

import { baseLogs, errorLogs } from '../../model/mocks/logs';
import { parseProgramLogs } from '../../model/parse-program-logs';
import { toInstructionLogRows } from '../../model/to-log-rows';
import { ProgramLogs } from '../ProgramLogs';

const VOTING = { name: 'Initialize Poll', programId: new PublicKey('AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye') };
const ED25519 = {
    programId: new PublicKey('Ed25519SigVerify111111111111111111111111111'),
    programName: 'Ed25519 SigVerify Precompile',
};

const meta = {
    component: ProgramLogs,
    globals: { viewport: { value: 'responsive' } },
    parameters: { ...nextjsParameters },
    tags: ['autodocs', 'test'],
    title: 'Entities/Program Logs/ProgramLogs',
} satisfies Meta<typeof ProgramLogs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { instructions: [VOTING], rows: toRows(baseLogs, [VOTING]) },
};

export const InstructionWithNoLogs: Story = {
    args: { instructions: [ED25519, VOTING], rows: toRows(baseLogs, [ED25519, VOTING]) },
};

export const Error: Story = {
    args: { instructions: [VOTING], rows: toRows(errorLogs, [VOTING]) },
};

export const Dense: Story = {
    args: { density: 'dense', instructions: [VOTING], rows: toRows(baseLogs, [VOTING]) },
};

export const WithoutInstructions: Story = {
    args: { density: 'dense', rows: toRows(baseLogs, [VOTING]) },
};

function toRows(lines: string[], instructions: { programId: PublicKey }[]) {
    return toInstructionLogRows({
        cluster: Cluster.Mainnet,
        error: undefined,
        instructions,
        logs: parseProgramLogs(lines),
    });
}
