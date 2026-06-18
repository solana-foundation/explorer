import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { TxExecutionStatus } from '../TxExecutionStatus';

const signature = '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW';
const date = new Date('2024-01-15T10:30:00Z');
const link = `/tx/${signature}`;

const meta = {
    component: TxExecutionStatus,
    globals: { viewport: { value: 'responsive' } },
    tags: ['autodocs', 'test'],
    title: 'Entities/Program Logs/TxExecutionStatus',
} satisfies Meta<typeof TxExecutionStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
    args: {
        date,
        link,
        signature,
        status: 'success',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText(signature)).toBeInTheDocument();
        expect(canvas.getByText('10:30:00 UTC')).toBeInTheDocument();
        expect(canvas.getByText('Success', { exact: false })).toBeInTheDocument();

        const anchor = canvas.getByRole('link');
        expect(anchor).toHaveAttribute('href', link);
        expect(anchor).toHaveAttribute('target', '_blank');
    },
};

export const Error: Story = {
    args: {
        date,
        link,
        signature,
        status: 'error',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText(signature)).toBeInTheDocument();
        expect(canvas.getByText('Error', { exact: false })).toBeInTheDocument();
        expect(canvas.getByRole('link')).toHaveAttribute('href', link);
    },
};
