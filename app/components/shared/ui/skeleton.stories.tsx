import type { Meta, StoryObj } from '@storybook-config/types';
import { expect } from 'storybook/test';

import { Skeleton } from './skeleton';

const meta: Meta<typeof Skeleton> = {
    component: Skeleton,
    decorators: [
        Story => (
            <div className="w-96">
                <Story />
            </div>
        ),
    ],
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/Skeleton',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        className: 'h-4 w-48',
    },
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelector('.animate-pulse')).toBeInTheDocument();
    },
};

export const TextBlock: Story = {
    render: () => (
        <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    ),
};

export const Circle: Story = {
    args: {
        className: 'size-12 rounded-full',
    },
};

export const CardPlaceholder: Story = {
    render: () => (
        <div className="flex items-center gap-4">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
            </div>
        </div>
    ),
};
