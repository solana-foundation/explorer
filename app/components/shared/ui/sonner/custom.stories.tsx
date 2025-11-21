import type { Meta, StoryObj } from '@storybook/react';
import { toast as sonnerToast } from 'sonner';
import { expect, within } from 'storybook/test';

import { Button } from '../button';
import { CustomToast } from './custom';
import { Toaster } from './toaster';

const meta = {
    component: CustomToast,
    decorators: [
        Story => (
            <div>
                <Toaster position="bottom-center" toastOptions={{ duration: 5_000 }} />
                <Story />
            </div>
        ),
    ],
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    title: 'Components/Shared/UI/Sonner/CustomToast',
} satisfies Meta<typeof CustomToast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
    args: {
        description: 'Connected to wallet X5s...GnDZ',
        id: 'success-toast',
        title: 'Wallet Connected',
        type: 'success',
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);

        const title = canvas.getByText('Wallet Connected');
        expect(title).toBeInTheDocument();

        const description = canvas.getByText('Connected to wallet X5s...GnDZ');
        expect(description).toBeInTheDocument();

        const closeButton = canvas.getAllByRole('button');
        expect(closeButton.length).toBeGreaterThan(0);
    },
    render: args => (
        <div className="e-flex e-flex-col e-items-center e-gap-4">
            <CustomToast {...args} />
            <Button
                size="sm"
                variant="outline"
                onClick={() => {
                    sonnerToast.custom(id => <CustomToast {...args} id={id} />);
                }}
            >
                Show Success Toast
            </Button>
        </div>
    ),
};

export const Error: Story = {
    args: {
        description: 'Unable to process transaction. Please try again.',
        id: 'error-toast',
        title: 'Transaction Failed',
        type: 'error',
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);

        const title = canvas.getByText('Transaction Failed');
        expect(title).toBeInTheDocument();

        const description = canvas.getByText('Unable to process transaction. Please try again.');
        expect(description).toBeInTheDocument();

        const closeButton = canvas.getAllByRole('button');
        expect(closeButton.length).toBeGreaterThan(0);
    },
    render: args => (
        <div className="e-flex e-flex-col e-items-center e-gap-4">
            <CustomToast {...args} />
            <Button
                size="sm"
                variant="outline"
                onClick={() => {
                    sonnerToast.custom(id => <CustomToast {...args} id={id} />);
                }}
            >
                Show Error Toast
            </Button>
        </div>
    ),
};

export const Info: Story = {
    args: {
        description: 'Your transaction is being confirmed on the blockchain.',
        id: 'info-toast',
        title: 'Processing Transaction',
        type: 'info',
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);

        const title = canvas.getByText('Processing Transaction');
        expect(title).toBeInTheDocument();

        const description = canvas.getByText('Your transaction is being confirmed on the blockchain.');
        expect(description).toBeInTheDocument();

        const closeButton = canvas.getAllByRole('button');
        expect(closeButton.length).toBeGreaterThan(0);
    },
    render: args => (
        <div className="e-flex e-flex-col e-items-center e-gap-4">
            <CustomToast {...args} />
            <Button
                size="sm"
                variant="outline"
                onClick={() => {
                    sonnerToast.custom(id => <CustomToast {...args} id={id} />);
                }}
            >
                Show Info Toast
            </Button>
        </div>
    ),
};

export const WithLongTitle: Story = {
    args: {
        description:
            'This toast demonstrates how the component handles a very long title that may wrap to multiple lines.',
        id: 'long-title-toast',
        title: 'This is a very long title that demonstrates how the toast component handles text wrapping when the title exceeds the available width',
        type: 'info',
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);

        const title = canvas.getByText(/This is a very long title/);
        expect(title).toBeInTheDocument();

        const description = canvas.getByText(/This toast demonstrates/);
        expect(description).toBeInTheDocument();

        const closeButton = canvas.getAllByRole('button');
        expect(closeButton.length).toBeGreaterThan(0);
    },
    render: args => (
        <div className="e-flex e-flex-col e-items-center e-gap-4">
            <CustomToast {...args} />
            <Button
                size="sm"
                variant="outline"
                onClick={() => {
                    sonnerToast.custom(id => <CustomToast {...args} id={id} />);
                }}
            >
                Show Toast with Long Title
            </Button>
        </div>
    ),
};

export const WithoutDescription: Story = {
    args: {
        id: 'no-description-toast',
        title: 'Action Completed',
        type: 'success',
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);

        const title = canvas.getByText('Action Completed');
        expect(title).toBeInTheDocument();

        const closeButton = canvas.getAllByRole('button');
        expect(closeButton.length).toBeGreaterThan(0);
    },
    render: args => (
        <div className="e-flex e-flex-col e-items-center e-gap-4">
            <CustomToast {...args} />
            <Button
                size="sm"
                variant="outline"
                onClick={() => {
                    sonnerToast.custom(id => <CustomToast {...args} id={id} />);
                }}
            >
                Show Toast without Description
            </Button>
        </div>
    ),
};

export const WithCustomDescription: Story = {
    args: {
        description: '',
        id: 'reactnode-toast',
        title: 'Transaction Complete',
        type: 'success',
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);

        const title = canvas.getByText('Transaction Complete');
        expect(title).toBeInTheDocument();

        const signature = canvas.getByText(/Transaction signature:/);
        expect(signature).toBeInTheDocument();

        const link = canvas.getByText('View on Explorer');
        expect(link).toBeInTheDocument();

        const closeButton = canvas.getAllByRole('button');
        expect(closeButton.length).toBeGreaterThan(0);
    },
    render: args => {
        const description = (
            <div className="e-text-xs e-text-neutral-300">
                <p className="e-mb-1">Transaction signature: 5X5s...GnDZ</p>
                <a
                    href="#"
                    className="e-text-indigo-400 e-underline hover:e-text-indigo-300"
                    onClick={e => {
                        e.preventDefault();
                        console.log('View transaction clicked');
                    }}
                >
                    View on Explorer
                </a>
            </div>
        );

        return (
            <div className="e-flex e-flex-col e-items-center e-gap-4">
                <CustomToast {...args} description={description} />
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                        sonnerToast.custom(id => <CustomToast {...args} id={id} description={description} />);
                    }}
                >
                    Show Toast with ReactNode Description
                </Button>
            </div>
        );
    },
};
