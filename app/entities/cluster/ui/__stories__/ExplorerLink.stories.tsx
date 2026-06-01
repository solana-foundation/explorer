import type { Meta, StoryObj } from '@storybook/react';
import { DEFAULT_SIGNATURE } from '@storybook-config/__fixtures__/defaults';
import { withCluster } from '@storybook-config/decorators';

import { ExplorerLink } from '../ExplorerLink';

const meta: Meta<typeof ExplorerLink> = {
    component: ExplorerLink,
    decorators: [withCluster],
    tags: ['autodocs'],
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
        className: 'e-text-blue-500 e-underline',
        label: 'Open',
        path: '/',
    },
};
