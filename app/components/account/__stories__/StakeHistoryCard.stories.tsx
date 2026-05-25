import type { Meta, StoryObj } from '@storybook/react';

import { nextjsParameters, withCluster } from '@storybook-config/decorators';

import { StakeHistoryCard } from '../StakeHistoryCard';

const meta: Meta<typeof StakeHistoryCard> = {
    component: StakeHistoryCard,
    decorators: [withCluster],
    parameters: nextjsParameters,
    title: 'Components/Account/StakeHistoryCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

const history = Array.from({ length: 5 }, (_, i) => ({
    epoch: 520 - i,
    stakeHistory: {
        effective: BigInt(12_345_678_900 + i * 100_000_000),
        activating: BigInt(987_654_321 - i * 10_000_000),
        deactivating: BigInt(123_456_789 + i * 5_000_000),
    },
}));

export const WithEntries: Story = {
    args: {
        sysvarAccount: { info: history } as any,
    },
};

export const Empty: Story = {
    args: { sysvarAccount: { info: [] } as any },
};
