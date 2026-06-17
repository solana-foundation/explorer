import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

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
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Interactive IDL/BaseClusterSelector',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        currentCluster: 'Devnet',
        onClusterChange: fn(),
    },
};

export const MainnetWithWarning: Story = {
    args: {
        currentCluster: 'Mainnet Beta',
        onClusterChange: fn(),
        showMainnetWarning: true,
    },
};

export const Testnet: Story = {
    args: {
        currentCluster: 'Testnet',
        onClusterChange: fn(),
    },
};

export const Custom: Story = {
    args: {
        currentCluster: 'Custom',
        onClusterChange: fn(),
    },
};

export const Disabled: Story = {
    args: {
        currentCluster: 'Devnet',
        disabled: true,
    },
};
