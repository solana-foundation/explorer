import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, fn, userEvent, within } from 'storybook/test';

import { RawDataSizeField } from '../RawDataSizeField';

const messageBytes = new Uint8Array(Array.from({ length: 96 }, (_, i) => i));

const meta: Meta<typeof RawDataSizeField> = {
    args: { filename: 'transaction', state: { messageBytes, status: 'loaded', summaries: [] } },
    component: RawDataSizeField,
    tags: ['autodocs', 'test'],
    title: 'Features/TransactionHistory/RawDataSizeField',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithData: Story = {
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('button', { name: '96' })).toBeVisible();
    },
};

export const Loading: Story = {
    args: { state: { status: 'loading' } },
};

const retrySize = fn();
export const Retry: Story = {
    args: { state: { retry: retrySize, status: 'failed' } },
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Retry loading size' }));
        await expect(retrySize).toHaveBeenCalled();
    },
};
