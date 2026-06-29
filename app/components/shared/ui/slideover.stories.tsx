import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { Button } from './button';
import {
    Slideover,
    SlideoverBody,
    SlideoverClose,
    SlideoverContent,
    SlideoverHeader,
    SlideoverTitle,
    SlideoverTrigger,
} from './slideover';

const meta: Meta<typeof Slideover> = {
    component: Slideover,
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/Slideover',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: 'Open Slideover' });
        await userEvent.click(trigger);
        const body = within(document.body);
        const dialog = await body.findByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(body.getByText('Slideover Title')).toBeInTheDocument();
    },
    render: function DefaultSlideover() {
        const [open, setOpen] = useState(false);
        return (
            <Slideover open={open} onOpenChange={setOpen}>
                <SlideoverTrigger asChild>
                    <Button variant="outline" size="sm">
                        Open Slideover
                    </Button>
                </SlideoverTrigger>
                <SlideoverContent aria-describedby={undefined}>
                    <SlideoverHeader>
                        <SlideoverTitle>Slideover Title</SlideoverTitle>
                    </SlideoverHeader>
                    <SlideoverBody className="p-4">
                        <p className="text-sm text-outer-space-300">
                            This is the slideover body. It scrolls independently from the header and footer.
                        </p>
                    </SlideoverBody>
                </SlideoverContent>
            </Slideover>
        );
    },
};

export const WithFooter: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Open' }));
        const body = within(document.body);
        await body.findByRole('dialog');
        const closeBtn = body.getByRole('button', { name: 'Close' });
        expect(closeBtn).toBeInTheDocument();
        await userEvent.click(closeBtn);
        expect(body.queryByRole('dialog')).toHaveAttribute('data-state', 'closed');
    },
    render: function WithFooterSlideover() {
        const [open, setOpen] = useState(false);
        return (
            <Slideover open={open} onOpenChange={setOpen}>
                <SlideoverTrigger asChild>
                    <Button variant="outline" size="sm">
                        Open
                    </Button>
                </SlideoverTrigger>
                <SlideoverContent aria-describedby={undefined}>
                    <SlideoverHeader>
                        <SlideoverTitle>Account 1</SlideoverTitle>
                    </SlideoverHeader>
                    <SlideoverBody className="p-4">
                        <p className="text-sm text-outer-space-300">Account details go here.</p>
                    </SlideoverBody>
                    <div className="flex shrink-0 gap-2 p-3">
                        <SlideoverClose asChild>
                            <Button className="w-full" size="sm" variant="outline">
                                Close
                            </Button>
                        </SlideoverClose>
                    </div>
                </SlideoverContent>
            </Slideover>
        );
    },
};
