import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, fn, userEvent, within } from 'storybook/test';

import { BaseInstructionIntentButton } from '../BaseInstructionIntentButton';

const meta = {
    args: { onClick: fn(), open: false, status: 'idle' },
    component: BaseInstructionIntentButton,
    tags: ['autodocs', 'test'],
    title: 'Entities/InstructionIntent/BaseInstructionIntentButton',
} satisfies Meta<typeof BaseInstructionIntentButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
    play: async ({ args, canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Intent' }));
        await expect(args.onClick).toHaveBeenCalledOnce();
    },
};

export const Open: Story = {
    args: { open: true },
};

export const Loading: Story = {
    args: { open: true, status: 'loading' },
};

export const Unavailable: Story = {
    args: { status: 'unavailable' },
    play: async ({ canvasElement }) => {
        const button = within(canvasElement).getByRole('button', { name: 'Intent unavailable' });

        await expect(button.className).toContain('border-dashed');
    },
};

export const UnavailableOpen: Story = {
    args: { open: true, status: 'unavailable' },
};

export const Failed: Story = {
    args: { status: 'failed' },
    play: async ({ canvasElement }) => {
        const button = within(canvasElement).getByRole('button', { name: 'Intent failed to load' });

        await expect(button.className).toContain('border-dashed');
    },
};
