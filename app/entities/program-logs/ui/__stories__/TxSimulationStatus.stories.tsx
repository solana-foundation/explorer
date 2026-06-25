import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { TxSimulationStatus } from '../TxSimulationStatus';

const date = new Date('2024-01-15T10:30:00Z');
const serializedMessage =
    'AQADByTPMvZ5NhbwY7GzM3bmF6aUB0Es9utyRgN3KoaqxFltNfKjDEAu3mQ7ldMPRzdZ2rwfown8mXJVsLSeFIoWPQObM34V';
const inspectorLink = `/tx/inspector?message=${serializedMessage}`;

const meta: Meta<typeof TxSimulationStatus> = {
    component: TxSimulationStatus,
    globals: { viewport: { value: 'responsive' } },
    tags: ['autodocs', 'test'],
    title: 'Entities/Program Logs/TxSimulationStatus',
};

export default meta;
type Story = StoryObj<typeof TxSimulationStatus>;

export const Success: Story = {
    args: {
        date,
        link: inspectorLink,
        status: 'success',
        unitsConsumed: 123_456,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('123,456 CU')).toBeInTheDocument();
        expect(canvas.getByText('10:30:00 UTC')).toBeInTheDocument();
        expect(canvas.getByText('Simulated', { exact: false })).toBeInTheDocument();
        expect(canvas.getByRole('link')).toHaveAttribute('href', inspectorLink);
    },
};

export const SuccessNoUnits: Story = {
    args: {
        date,
        link: inspectorLink,
        status: 'success',
        unitsConsumed: undefined,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.queryByText('CU', { exact: false })).not.toBeInTheDocument();
        expect(canvas.getByText('Simulated', { exact: false })).toBeInTheDocument();
    },
};

export const Error: Story = {
    args: {
        date,
        link: inspectorLink,
        message: 'AccountNotFound: account does not exist or has no data',
        status: 'error',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('AccountNotFound: account does not exist or has no data')).toBeInTheDocument();
        expect(canvas.getByText('Simulation Error', { exact: false })).toBeInTheDocument();
        expect(canvas.getByRole('link')).toHaveAttribute('href', inspectorLink);
    },
};

export const SerializedMessage: Story = {
    args: {
        date,
        link: inspectorLink,
        message: serializedMessage,
        status: 'error',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText(serializedMessage)).toBeInTheDocument();
        expect(canvas.getByText('Simulation Error', { exact: false })).toBeInTheDocument();
        expect(canvas.getByRole('link')).toHaveAttribute('href', inspectorLink);
    },
};

export const ErrorNoLink: Story = {
    args: {
        date,
        message: 'Simulation failed: wallet not connected',
        status: 'error',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Simulation failed: wallet not connected')).toBeInTheDocument();
        expect(canvas.queryByRole('link')).not.toBeInTheDocument();
        expect(canvas.getByText('Simulation Error', { exact: false })).toBeInTheDocument();
    },
};
