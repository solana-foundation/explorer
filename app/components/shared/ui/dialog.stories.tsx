import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { AlertCircle, Send } from 'react-feather';
import { expect, userEvent, within } from 'storybook/test';

import { Button } from './button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './dialog';

const meta: Meta<typeof Dialog> = {
    component: Dialog,
    parameters: {
        layout: 'centered',
    },
    title: 'Components/Shared/UI/Dialog',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: 'Open Dialog' });
        await userEvent.click(trigger);
        const dialog = await canvas.findByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(canvas.getByText('Dialog Title')).toBeInTheDocument();
    },
    render: function DefaultDialog() {
        const [open, setOpen] = useState(false);
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        Open Dialog
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Dialog Title</DialogTitle>
                        <DialogDescription>
                            This is a default dialog with a title, description, and close button.
                        </DialogDescription>
                    </DialogHeader>
                    Dialog content goes here. You can add any content you need inside the dialog.
                </DialogContent>
            </Dialog>
        );
    },
};

export const WarningDialog: Story = {
    render: function WarningDialogComponent() {
        const [open, setOpen] = useState(false);
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        Open Warning Dialog
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            <AlertCircle className="e-mr-2 e-text-destructive" size={14} />
                            Spend real funds?
                        </DialogTitle>
                        <DialogDescription className="e-pl-6">
                            You&apos;re connected to Mainnet. Any SOL you send now is permanent and costs real money.
                            Make sure the details are correct before continuing.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" size="sm">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button variant="destructive" size="sm">
                            <Send />
                            Yes, spend real funds
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    },
};
