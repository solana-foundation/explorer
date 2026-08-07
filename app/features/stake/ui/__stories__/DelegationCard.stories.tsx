import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '../../../../../.storybook/decorators';
import { makeStakeAccountInfo } from '../../__fixtures__/stake-account';
import { DelegationCard } from '../StakeAccountSection';

const DELEGATED_STAKE = 1_000_000_000; // 1 SOL

const meta = {
    component: DelegationCard,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/Stake/DelegationCard',
} satisfies Meta<typeof DelegationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    activation: { active: DELEGATED_STAKE, inactive: 0, state: 'active' as const },
    solPrice: null,
    stakeAccount: makeStakeAccountInfo(),
};

export const TotalRewardLoading: Story = {
    // The total is fetched separately from the account, so the row shows its own placeholder
    // while the rest of the card is already populated.
    args: { ...args, totalReward: { status: 'loading' } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Total Reward (SOL)')).toBeInTheDocument();
        expect(canvas.getByText('Delegated Stake (SOL)')).toBeInTheDocument();
        expect(canvas.queryByText('Unavailable')).not.toBeInTheDocument();
    },
};

export const TotalRewardReady: Story = {
    args: { ...args, totalReward: { lamports: 4_200_824, status: 'ready' } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('◎0.004200824')).toBeInTheDocument();
        expect(canvas.queryByText('Unavailable')).not.toBeInTheDocument();
    },
};

export const TotalRewardUnavailable: Story = {
    // A failed lookup must not read as "this account earned nothing", so the row shows a quiet
    // message rather than a zero, and the other rows keep working.
    args: { ...args, totalReward: { status: 'unavailable' } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // The row renders exactly one branch, so showing the message proves it is not showing a
        // number. The neighbouring rows keep working — a missing total is not a broken card.
        expect(canvas.getByText('Unavailable')).toBeInTheDocument();
        expect(canvas.getByText('Delegated Vote Address')).toBeInTheDocument();
        expect(canvas.getByText('Delegated Stake (SOL)')).toBeInTheDocument();
    },
};
