/* eslint-disable no-restricted-syntax -- storybook play functions use RegExp for pattern matching */
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, fn, userEvent, within } from 'storybook/test';

import { DownloadDropdown } from '../DownloadDropdown';

const meta: Meta<typeof DownloadDropdown> = {
    component: DownloadDropdown,
    tags: ['autodocs', 'test'],
    title: 'Shared/DownloadDropdown',
};

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_DATA = new Uint8Array([72, 101, 108, 108, 111]);

export const Default: Story = {
    args: {
        data: SAMPLE_DATA,
        filename: 'test-transaction',
    },
};

export const WithData: Story = {
    args: {
        data: SAMPLE_DATA,
        filename: 'test-transaction',
    },
};

export const Loading: Story = {
    args: {
        data: undefined,
        filename: 'test-transaction',
        loading: true,
    },
};

export const Error: Story = {
    args: {
        data: undefined,
        error: new window.Error('RPC timeout'),
        filename: 'test-transaction',
    },
};

export const CustomEncodings: Story = {
    args: {
        data: SAMPLE_DATA,
        encodings: ['hex', 'base64'],
        filename: 'test-transaction',
    },
};

export const SingleEncoding: Story = {
    args: {
        data: SAMPLE_DATA,
        encodings: ['hex'],
        filename: 'test-transaction',
    },
};

export const SingleEncodingLoading: Story = {
    args: {
        data: undefined,
        encodings: ['hex'],
        filename: 'test-transaction',
        loading: true,
    },
};

export const OnOpenChange: Story = {
    args: {
        data: SAMPLE_DATA,
        encodings: ['hex', 'base58', 'base64'],
        filename: 'test-transaction',
        onOpenChange: fn(),
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: /download/i });
        await userEvent.click(trigger);
        expect(args.onOpenChange).toHaveBeenCalledWith(true);
    },
};

export const OpenWithData: Story = {
    args: {
        data: SAMPLE_DATA,
        encodings: ['hex', 'base58', 'base64'],
        filename: 'test-transaction',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: /download/i });
        await userEvent.click(trigger);
        expect(trigger).toHaveAttribute('data-state', 'open');
    },
};

export const OpenLoading: Story = {
    args: {
        data: undefined,
        encodings: ['hex', 'base58', 'base64'],
        filename: 'test-transaction',
        loading: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: /download/i });
        await userEvent.click(trigger);
        expect(trigger).toHaveAttribute('data-state', 'open');
    },
};

export const OpenError: Story = {
    args: {
        data: undefined,
        encodings: ['hex', 'base58', 'base64'],
        error: new window.Error('RPC timeout'),
        filename: 'test-transaction',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: /download/i });
        await userEvent.click(trigger);
        expect(trigger).toHaveAttribute('data-state', 'open');
    },
};
