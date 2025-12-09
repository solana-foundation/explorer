import type { Meta, StoryObj } from '@storybook/react';

import { BaseClusterSelector } from '../BaseClusterSelector';

const meta: Meta<typeof BaseClusterSelector> = {
    component: BaseClusterSelector,
    decorators: [
        Story => (
            <div
                style={{
                    width: '500px',
                }}
            >
                <Story />
            </div>
        ),
    ],
    parameters: {
        layout: 'padded',
    },
    title: 'Features/IDL/Interactive IDL/UI/BaseClusterSelector',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        currentCluster: 'Devnet',
        onClusterChange: () => console.log('Cluster change clicked'),
    },
};

export const MainnetWithWarning: Story = {
    args: {
        currentCluster: 'Mainnet Beta',
        onClusterChange: () => console.log('Cluster change clicked'),
        showMainnetWarning: true,
    },
};

export const Testnet: Story = {
    args: {
        currentCluster: 'Testnet',
        onClusterChange: () => console.log('Cluster change clicked'),
    },
};

export const Custom: Story = {
    args: {
        currentCluster: 'Custom',
        onClusterChange: () => console.log('Cluster change clicked'),
    },
};

export const Disabled: Story = {
    args: {
        currentCluster: 'Devnet',
        disabled: true,
    },
};
