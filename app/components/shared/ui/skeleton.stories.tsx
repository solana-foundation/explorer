import type { Meta, StoryObj } from '@storybook/react';
import { expect } from 'storybook/test';

import { Skeleton } from './skeleton';

const meta: Meta<typeof Skeleton> = {
    component: Skeleton,
    decorators: [
        Story => (
            <div className="e-w-96">
                <Story />
            </div>
        ),
    ],
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/UI/Skeleton',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        className: 'e-h-4 e-w-48',
    },
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelector('.e-animate-pulse')).toBeInTheDocument();
    },
};

export const TextBlock: Story = {
    render: () => (
        <div className="e-flex e-flex-col e-gap-2">
            <Skeleton className="e-h-4 e-w-full" />
            <Skeleton className="e-h-4 e-w-3/4" />
            <Skeleton className="e-h-4 e-w-1/2" />
        </div>
    ),
};

export const Circle: Story = {
    args: {
        className: 'e-size-12 e-rounded-full',
    },
};

export const CardPlaceholder: Story = {
    render: () => (
        <div className="e-flex e-items-center e-gap-4">
            <Skeleton className="e-size-12 e-rounded-full" />
            <div className="e-flex e-flex-1 e-flex-col e-gap-2">
                <Skeleton className="e-h-4 e-w-1/2" />
                <Skeleton className="e-h-4 e-w-full" />
            </div>
        </div>
    ),
};
