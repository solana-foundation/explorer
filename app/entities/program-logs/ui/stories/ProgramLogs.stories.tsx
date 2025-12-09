import type { Meta, StoryObj } from '@storybook/react';

import { baseLogs, errorLogs } from '../../model/mocks/logs';
import { parsedBaseLogs, parsedErrorLogs } from '../../model/mocks/parsedLogs';
import { ProgramLogs } from '../ProgramLogs';

const meta = {
    component: ProgramLogs,
    decorators: [
        Story => (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '600px',
                    maxWidth: '100%',
                    width: '800px',
                }}
            >
                <Story />
            </div>
        ),
    ],
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    title: 'Entities/Program Logs/UI/ProgramLogs',
} satisfies Meta<typeof ProgramLogs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        logs: baseLogs,
        parseLogs: () => parsedBaseLogs,
    },
};

export const WithProgramName: Story = {
    args: {
        logs: baseLogs,
        parseLogs: () => parsedBaseLogs,
        programName: 'Voting',
    },
};

export const Error: Story = {
    args: {
        logs: errorLogs,
        parseLogs: () => parsedErrorLogs,
    },
};

export const Empty: Story = {
    args: {
        logs: [],
        parseLogs: () => [],
    },
};
