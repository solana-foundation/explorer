import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, userEvent, within } from 'storybook/test';

import { RawDataField } from '../RawDataField';

const mockSmallData = new Uint8Array([
    0x45, 0xea, 0x11, 0xda, 0x63, 0xb6, 0x7f, 0x5b, 0x42, 0xc9, 0xdd, 0x96, 0x36, 0x9b, 0x8f, 0xf2,
]);

const mockLargeData = (() => {
    const data = new Uint8Array(512);
    for (let i = 0; i < data.length; i++) {
        data[i] = i % 256;
    }
    return data;
})();

const meta: Meta<typeof RawDataField> = {
    component: RawDataField,
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/RawDataField',
};

export default meta;
type Story = StoryObj<typeof meta>;

/** 16 bytes — no Show more needed. */
export const Default: Story = {
    args: {
        data: mockSmallData,
        filename: 'account',
        loading: false,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Hex')).toBeInTheDocument();
        await expect(canvas.getByText('Base64')).toBeInTheDocument();
        await expect(canvas.getByText('16 bytes')).toBeInTheDocument();
    },
};

/** 512 bytes — hex rows are truncated, Show more button appears. */
export const LargeData: Story = {
    args: {
        data: mockLargeData,
        filename: 'account',
        loading: false,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('512 bytes')).toBeInTheDocument();
        const showMoreBtn = canvas.getByRole('button', { name: 'Show more' });
        await expect(showMoreBtn).toBeInTheDocument();
        await userEvent.click(showMoreBtn);
        await expect(canvas.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
    },
};

/** Loading state — spinner shown, buttons disabled. */
export const Loading: Story = {
    args: {
        data: undefined,
        filename: 'account',
        loading: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Copy' })).toBeDisabled();
        await expect(canvas.getByRole('button', { name: 'Download' })).toBeDisabled();
    },
};

/** The fetch failed — say so rather than showing an empty viewer. */
export const LoadFailed: Story = {
    args: {
        data: undefined,
        error: new Error('RPC request failed'),
        filename: 'account',
        loading: false,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Failed to load account data.')).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Copy' })).toBeDisabled();
        await expect(canvas.getByRole('button', { name: 'Download' })).toBeDisabled();
    },
};

/** A refetch failed while the previous bytes are still held — show the bytes, not the error. */
export const RefetchFailedWithData: Story = {
    args: {
        data: mockSmallData,
        error: new Error('RPC request failed'),
        filename: 'account',
        loading: false,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByText('Failed to load account data.')).not.toBeInTheDocument();
        await expect(canvas.getByText('16 bytes')).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Copy' })).toBeEnabled();
        await expect(canvas.getByRole('button', { name: 'Download' })).toBeEnabled();
    },
};

/** Empty data — "No data" message. */
export const NoData: Story = {
    args: {
        data: new Uint8Array(0),
        filename: 'account',
        loading: false,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('No data')).toBeInTheDocument();
    },
};
