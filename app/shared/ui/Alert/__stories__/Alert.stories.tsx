import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { Alert } from '../Alert';

const meta: Meta<typeof Alert> = {
    component: Alert,
    tags: ['autodocs', 'test'],
    title: 'Shared/UI/Alert',
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default: padded, rounded, transparent border. Used as a neutral notice container.
export const Default: Story = {
    args: {
        children: 'A neutral notice without colour. Used as a styled container for inline information.',
        variant: 'default',
    },
    play: async ({ canvasElement }) => {
        const alert = within(canvasElement).getByRole('alert');
        await expect(alert).toBeVisible();
    },
};

export const Info: Story = {
    args: {
        children: 'Informational message.',
        variant: 'info',
    },
};

export const Success: Story = {
    args: {
        children: 'Success message.',
        variant: 'success',
    },
};

export const Warning: Story = {
    args: {
        children: 'Warning message.',
        variant: 'warning',
    },
};

export const Danger: Story = {
    args: {
        children: 'Danger / error message.',
        variant: 'danger',
    },
};
