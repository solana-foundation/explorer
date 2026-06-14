import type { Meta, StoryObj } from '@storybook/react';
import { toast } from 'sonner';
import { expect, within } from 'storybook/test';

import { Toaster } from './toaster';

const meta: Meta<typeof Toaster> = {
    args: {
        position: 'bottom-center',
        // Infinity keeps the fired toast on screen — deterministic for screenshot capture
        toastOptions: { duration: Infinity },
    },
    component: Toaster,
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/UI/Sonner/Toaster',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        toast.dismiss();
        toast('Snapshot saved');
        await expect(await canvas.findByText('Snapshot saved')).toBeInTheDocument();
    },
};

export const Success: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        toast.dismiss();
        toast.success('Transaction confirmed');
        await expect(await canvas.findByText('Transaction confirmed')).toBeInTheDocument();
    },
};

export const Error: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        toast.dismiss();
        toast.error('Transaction failed');
        await expect(await canvas.findByText('Transaction failed')).toBeInTheDocument();
    },
};

export const WithDescription: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        toast.dismiss();
        toast('Wallet connected', { description: 'X5s…GnDZ on mainnet-beta' });
        await expect(await canvas.findByText('Wallet connected')).toBeInTheDocument();
        await expect(await canvas.findByText('X5s…GnDZ on mainnet-beta')).toBeInTheDocument();
    },
};
