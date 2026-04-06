import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { RefreshButton } from './refresh-button';

const meta: Meta<typeof RefreshButton> = {
    component: RefreshButton,
    parameters: {
        layout: 'centered',
    },
    title: 'Components/Shared/UI/RefreshButton',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        analyticsSection: 'story_demo',
        onClick: fn(),
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const button = canvas.getByRole('button', { name: 'Refresh' });
        expect(button).toBeInTheDocument();
        expect(button).not.toBeDisabled();
        await userEvent.click(button);
        expect(args.onClick).toHaveBeenCalledTimes(1);
    },
};

export const Loading: Story = {
    args: {
        analyticsSection: 'story_demo',
        fetching: true,
        onClick: fn(),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const button = canvas.getByRole('button', { name: 'Refresh' });
        expect(button).toBeDisabled();
    },
};
