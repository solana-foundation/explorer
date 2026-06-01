import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { ExpandInfoButton } from '../ExpandInfoButton';

const meta: Meta<typeof ExpandInfoButton> = {
    args: {
        controlsId: 'feature-detail-demo',
        onToggle: fn(),
    },
    component: ExpandInfoButton,
    tags: ['autodocs', 'test'],
    title: 'Features/FeatureGate/ExpandInfoButton',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
    args: { isExpanded: false },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const button = canvas.getByRole('button', { name: 'Show details' });
        await userEvent.click(button);
        await expect(args.onToggle).toHaveBeenCalledOnce();
    },
};

export const Expanded: Story = {
    args: { isExpanded: true },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Hide details' })).toHaveAttribute('aria-expanded', 'true');
    },
};
