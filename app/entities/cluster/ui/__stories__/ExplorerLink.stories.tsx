import { DEFAULT_SIGNATURE } from '@__fixtures__/gen';
import type { Meta, StoryObj } from '@storybook/react';
import { withCluster } from '@storybook-config/decorators';

import { ExplorerLink } from '../ExplorerLink';

const meta: Meta<typeof ExplorerLink> = {
    component: ExplorerLink,
    decorators: [withCluster],
    tags: ['autodocs', 'test'],
    title: 'Entities/Cluster/ExplorerLink',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        label: 'View on Explorer',
        path: '/address/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    },
};

export const TransactionPath: Story = {
    args: {
        label: 'View transaction',
        path: `/tx/${DEFAULT_SIGNATURE}`,
    },
};

export const WithCustomClass: Story = {
    args: {
        className: 'text-blue-500 underline',
        label: 'Open',
        path: '/',
    },
};
