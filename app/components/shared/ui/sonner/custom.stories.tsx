/* eslint-disable no-restricted-syntax -- storybook play functions use RegExp for pattern matching */
import type { Meta, StoryObj } from '@storybook-config/types';
import { toast as sonnerToast } from 'sonner';
import { expect, fn, within } from 'storybook/test';

import { Button } from '../button';
import { CustomToast, type CustomToastProps } from './custom';
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
        // Centers the trigger button + inline preview in the canvas so they're immediately visible.
        layout: 'centered',
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/Sonner/CustomToast',
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
    play: ({ canvasElement }) => expectToast(canvasElement, 'Wallet Connected', 'Connected to wallet X5s...GnDZ'),
    render: args => <ToastWithTrigger {...args} trigger="Show Success Toast" />,
};

export const Error: Story = {
    args: {
        description: 'Unable to process transaction. Please try again.',
        id: 'error-toast',
        title: 'Transaction Failed',
        type: 'error',
    },
    play: ({ canvasElement }) =>
        expectToast(canvasElement, 'Transaction Failed', 'Unable to process transaction. Please try again.'),
    render: args => <ToastWithTrigger {...args} trigger="Show Error Toast" />,
};

export const Info: Story = {
    args: {
        description: 'Your transaction is being confirmed on the blockchain.',
        id: 'info-toast',
        title: 'Processing Transaction',
        type: 'info',
    },
    play: ({ canvasElement }) =>
        expectToast(canvasElement, 'Processing Transaction', 'Your transaction is being confirmed on the blockchain.'),
    render: args => <ToastWithTrigger {...args} trigger="Show Info Toast" />,
};

export const WithLongTitle: Story = {
    args: {
        description:
            'This toast demonstrates how the component handles a very long title that may wrap to multiple lines.',
        id: 'long-title-toast',
        title: 'This is a very long title that demonstrates how the toast component handles text wrapping when the title exceeds the available width',
        type: 'info',
    },
    play: ({ canvasElement }) => expectToast(canvasElement, /This is a very long title/, /This toast demonstrates/),
    render: args => <ToastWithTrigger {...args} trigger="Show Toast with Long Title" />,
};

export const WithoutDescription: Story = {
    args: {
        id: 'no-description-toast',
        title: 'Action Completed',
        type: 'success',
    },
    play: ({ canvasElement }) => expectToast(canvasElement, 'Action Completed'),
    render: args => <ToastWithTrigger {...args} trigger="Show Toast without Description" />,
};

export const WithCustomDescription: Story = {
    args: {
        description: '',
        id: 'reactnode-toast',
        title: 'Transaction Complete',
        type: 'success',
    },
    play: ({ canvasElement }) =>
        expectToast(canvasElement, 'Transaction Complete', /Transaction signature:/, 'View on Explorer'),
    render: args => {
        const onViewTransaction = fn();
        const description = (
            <div className="text-xs text-neutral-300">
                <p className="mb-1">Transaction signature: 5X5s...GnDZ</p>
                <a
                    href="#"
                    className="text-indigo-400 underline hover:text-indigo-300"
                    onClick={e => {
                        e.preventDefault();
                        onViewTransaction();
                    }}
                >
                    View on Explorer
                </a>
            </div>
        );

        return <ToastWithTrigger {...args} description={description} trigger="Show Toast with ReactNode Description" />;
    },
};

function ToastWithTrigger({ trigger, ...props }: CustomToastProps & { trigger: string }) {
    return (
        <div className="flex flex-col items-center gap-4">
            <CustomToast {...props} />
            <Button
                size="sm"
                variant="outline"
                onClick={() => {
                    sonnerToast.custom(id => <CustomToast {...props} id={id} />);
                }}
            >
                {trigger}
            </Button>
        </div>
    );
}

async function expectToast(canvasElement: HTMLElement, ...texts: (string | RegExp)[]) {
    const canvas = within(canvasElement);
    for (const text of texts) {
        expect(await canvas.findByText(text)).toBeInTheDocument();
    }
    expect(canvas.getAllByRole('button').length).toBeGreaterThan(0);
}
