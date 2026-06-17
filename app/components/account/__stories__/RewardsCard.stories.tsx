import { DispatchContext as RewardsDispatch, StateContext as RewardsStateCtx } from '@providers/accounts/rewards';
import { FetchStatus } from '@providers/cache';
import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { MockClusterProvider as ClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';
import { nextjsParameters, withClusterAndAccounts } from '@storybook-config/decorators';
import React from 'react';

import { RewardsCard } from '../RewardsCard';

const ADDRESS = '11111111111111111111111111111111';
const noop = () => undefined;

const rewardsState = {
    entries: {
        [ADDRESS]: {
            data: {
                foundOldest: true,
                highestFetchedEpoch: 502,
                lowestFetchedEpoch: 500,
                rewards: [
                    {
                        amount: 12_500_000,
                        commission: null,
                        effectiveSlot: 312_000_000,
                        epoch: 502,
                        postBalance: 5_012_500_000,
                        rewardType: 'staking',
                    },
                    {
                        amount: 11_800_000,
                        commission: null,
                        effectiveSlot: 311_500_000,
                        epoch: 501,
                        postBalance: 5_000_000_000,
                        rewardType: 'staking',
                    },
                ],
            },
            status: FetchStatus.Fetched,
        },
    },
    url: 'https://api.mainnet-beta.solana.com',
};

const withRewards: Decorator = Story => (
    <ClusterProvider>
        <RewardsStateCtx.Provider value={rewardsState as any}>
            <RewardsDispatch.Provider value={noop as any}>
                <Story />
            </RewardsDispatch.Provider>
        </RewardsStateCtx.Provider>
    </ClusterProvider>
);

const meta = {
    component: RewardsCard,
    decorators: [withClusterAndAccounts],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Account/RewardsCard',
} satisfies Meta<typeof RewardsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithRewardsList: Story = {
    args: { address: ADDRESS },
    decorators: [withRewards],
};
