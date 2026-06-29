import type { Meta, StoryObj } from '@storybook-config/types';

import { baseLogs, errorLogs } from '../../model/mocks/logs';
import { parsedBaseLogs, parsedErrorLogs } from '../../model/mocks/parsedLogs';
import { ProgramLogs } from '../ProgramLogs';

const meta = {
    component: ProgramLogs,
    globals: { viewport: { value: 'responsive' } },
    tags: ['autodocs', 'test'],
    title: 'Entities/Program Logs/ProgramLogs',
} satisfies Meta<typeof ProgramLogs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        parsedLogs: parsedBaseLogs,
        rawLogs: baseLogs,
    },
};

export const WithProgramName: Story = {
    args: {
        parsedLogs: parsedBaseLogs,
        programName: 'Voting',
        rawLogs: baseLogs,
    },
};

export const Error: Story = {
    args: {
        parsedLogs: parsedErrorLogs,
        rawLogs: errorLogs,
    },
};

export const Empty: Story = {
    args: {
        parsedLogs: [],
        rawLogs: [],
    },
};
