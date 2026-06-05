import { gen } from '@__fixtures__/gen';
import { DispatchContext as RewardsDispatch, StateContext as RewardsStateCtx } from '@providers/accounts/rewards';
import { FetchStatus } from '@providers/cache';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { MockClusterProvider as ClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';
import { nextjsParameters, withClusterAndAccounts } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import React from 'react';

import { RewardsCard } from '../RewardsCard';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
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
                        effectiveSlot: Number(gen.slot(0)),
                        epoch: 502,
                        postBalance: 5_012_500_000,
                        rewardType: 'staking',
                    },
                    {
                        amount: 11_800_000,
                        commission: null,
                        effectiveSlot: Number(gen.slot(1)),
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
    decorators: [withViewportFromGlobal, withClusterAndAccounts, withRewards],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/RewardsCard/Responsive',
} satisfies Meta<typeof RewardsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = { address: ADDRESS };

export const Mobile: Story = {
    args,
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    args,
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    args,
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};
