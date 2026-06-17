import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { FormControl } from '../FormControl';

const meta: Meta<typeof FormControl> = {
    component: FormControl,
    tags: ['autodocs', 'test'],
    title: 'Shared/FormControl',
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default variant: bordered, padded, rounded — Bootstrap .form-control equivalent.
export const DefaultInput: Story = {
    args: {
        children: <input type="text" placeholder="Type something..." defaultValue="hello world" />,
        variant: 'default',
    },
    play: async ({ canvasElement }) => {
        const input = within(canvasElement).getByPlaceholderText('Type something...');
        await expect(input).toBeVisible();
    },
};

export const DefaultTextarea: Story = {
    args: {
        children: <textarea rows={4} placeholder="Multi-line input..." />,
        variant: 'default',
    },
};

// Flush variant: borderless, transparent bg, no horizontal padding. Maps to .form-control-flush.
export const Flush: Story = {
    args: {
        children: <textarea rows={3} placeholder="Flush textarea..." />,
        variant: 'flush',
    },
};

// Flush + auto: borderless, no padding, auto-height. Maps to .form-control-flush + .form-control-auto.
// This is the variant used by RawInputCard's transaction input.
export const FlushAuto: Story = {
    args: {
        children: <textarea rows={3} placeholder="Flush-auto textarea..." />,
        className: 'font-mono',
        variant: 'flush-auto',
    },
};

// Composition: child is the actual element; FormControl applies form-control classes via Radix Slot.
// Useful for verifying that user-supplied className on the child is preserved alongside the variant classes.
export const WithChildClassName: Story = {
    args: {
        children: <textarea rows={3} className="font-mono" placeholder="Child has its own className" />,
        variant: 'flush-auto',
    },
};

// Disabled state: caller passes disabled on the native element; FormControl wrapper doesn't intercept.
export const Disabled: Story = {
    args: {
        children: <input type="text" defaultValue="Cannot edit" disabled />,
        variant: 'default',
    },
};
