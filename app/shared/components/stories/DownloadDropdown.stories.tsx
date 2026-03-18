/* eslint-disable no-restricted-syntax -- storybook play functions use RegExp for pattern matching */
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { DownloadDropdown } from '../DownloadDropdown';

const meta: Meta<typeof DownloadDropdown> = {
    component: DownloadDropdown,
    parameters: {
        layout: 'centered',
    },
    title: 'Shared/UI/DownloadDropdown',
};

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_DATA = new Uint8Array([72, 101, 108, 108, 111]);

export const WithData: Story = {
    args: {
        data: SAMPLE_DATA,
        filename: 'test-transaction',
    },
};

export const Loading: Story = {
    args: {
        data: null,
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

export const OnOpenChange: Story = {
    args: {
        data: SAMPLE_DATA,
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
        filename: 'test-transaction',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: /download/i });
        await userEvent.click(trigger);
        expect(trigger).toHaveAttribute('data-state', 'open');
    },
};

export const OpenWithoutData: Story = {
    args: {
        data: null,
        filename: 'test-transaction',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: /download/i });
        await userEvent.click(trigger);
        expect(trigger).toHaveAttribute('data-state', 'open');
    },
};
