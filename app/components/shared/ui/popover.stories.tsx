import type { Meta, StoryObj } from '@storybook-config/types';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

const meta: Meta<typeof Popover> = {
    component: Popover,
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/Popover',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: 'Open Popover' });

        await userEvent.click(trigger);

        const body = within(document.body);
        expect(await body.findByText('Popover')).toBeInTheDocument();
    },
    render: function DefaultPopover() {
        const [open, setOpen] = useState(false);

        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                        Open Popover
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 p-4">
                    <div className="space-y-2">
                        <p className="m-0 text-sm font-semibold text-white">Popover</p>
                        <p className="m-0 text-xs text-neutral-300">This is popover content.</p>
                    </div>
                </PopoverContent>
            </Popover>
        );
    },
};
