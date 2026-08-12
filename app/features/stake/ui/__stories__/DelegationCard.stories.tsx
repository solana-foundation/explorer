import { gen } from '@__fixtures__/gen';
import { address } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '../../../../../.storybook/decorators';
import { EPOCH_NEVER_SET } from '../../lib/constants';
import type { StakeAccountInfo } from '../../lib/validators';
import { TotalRewardStatus } from '../../model/use-total-reward';
import { DelegationCard } from '../StakeAccountSection';

// CUSTODIAN sentinel = System Program — convention for "no custodian set" in stake accounts.
const CUSTODIAN = SYSTEM_PROGRAM_ADDRESS;
// Seeded so the rendered addresses stay byte-identical between runs and snapshots don't churn.
const STAKER = address(gen.address(1));
const WITHDRAWER = address(gen.address(2));
const VOTER = address(gen.address(3));

const RENT_RESERVE = 2_282_880n;
const DELEGATED_STAKE = 1_000_000_000n; // 1 SOL
const SOL_PRICE = 150;

const stakeAccount: StakeAccountInfo = {
    meta: {
        authorized: { staker: STAKER, withdrawer: WITHDRAWER },
        lockup: { custodian: CUSTODIAN, epoch: 0, unixTimestamp: 0 },
        rentExemptReserve: RENT_RESERVE,
    },
    stake: {
        creditsObserved: 12_345,
        delegation: {
            activationEpoch: 100n,
            deactivationEpoch: EPOCH_NEVER_SET,
            stake: DELEGATED_STAKE,
            voter: VOTER,
            warmupCooldownRate: 0.09,
        },
    },
};

const meta = {
    component: DelegationCard,
    // The card renders vote/authority addresses, which resolve through both providers.
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/Stake/DelegationCard',
} satisfies Meta<typeof DelegationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TotalRewardReady: Story = {
    args: {
        activation: { active: Number(DELEGATED_STAKE), inactive: 0, state: 'active' },
        solPrice: SOL_PRICE,
        stakeAccount,
        totalReward: { lamports: 4_200_824, status: TotalRewardStatus.Ready },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Total Reward (SOL)')).toBeInTheDocument();
        expect(canvas.getByText('◎0.004200824')).toBeInTheDocument();
    },
};

// A zero total is a real answer — the account earned nothing yet — so it renders as an amount.
export const TotalRewardZero: Story = {
    args: {
        ...TotalRewardReady.args,
        totalReward: { lamports: 0, status: TotalRewardStatus.Ready },
    },
};

export const TotalRewardLoading: Story = {
    args: {
        ...TotalRewardReady.args,
        totalReward: { status: TotalRewardStatus.Loading },
    },
};

export const TotalRewardUnavailable: Story = {
    args: {
        ...TotalRewardReady.args,
        totalReward: { status: TotalRewardStatus.Unavailable },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Unavailable')).toBeInTheDocument();
    },
};
