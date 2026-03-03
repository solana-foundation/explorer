import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

const meta: Meta<typeof Popover> = {
    component: Popover,
    title: 'Components/Shared/UI/Popover',
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
                <PopoverContent align="start" className="e-w-64 e-p-4">
                    <div className="e-space-y-2">
                        <p className="e-m-0 e-text-sm e-font-semibold e-text-white">Popover</p>
                        <p className="e-m-0 e-text-xs e-text-neutral-300">This is popover content.</p>
                    </div>
                </PopoverContent>
            </Popover>
        );
    },
};
