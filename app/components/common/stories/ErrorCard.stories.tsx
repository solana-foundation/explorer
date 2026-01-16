import type { Meta, StoryObj } from '@storybook/react';

import { ErrorCard } from '../ErrorCard';

const meta = {
    component: ErrorCard,
    title: 'Components/Common/ErrorCard',
} satisfies Meta<typeof ErrorCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        text: 'Something went wrong',
    },
};

export const PageNotFound: Story = {
    args: {
        text: 'Page not found',
    },
};

export const WithRetry: Story = {
    args: {
        retry: () => alert('Retrying...'),
        text: 'Failed to load data',
    },
};

export const WithCustomRetryText: Story = {
    args: {
        retry: () => alert('Reloading...'),
        retryText: 'Reload Page',
        text: 'Connection lost',
    },
};

export const WithSubtext: Story = {
    args: {
        retry: () => {},
        subtext: 'Please check your network connection',
        text: 'Failed to fetch',
    },
};
