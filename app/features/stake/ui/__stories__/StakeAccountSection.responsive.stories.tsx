import type { Account } from '@providers/accounts';
import { address } from '@solana/kit';
import { STAKE_PROGRAM_ADDRESS } from '@solana-program/stake';
import type { Meta, StoryObj } from '@storybook/react';

import { toLegacyPublicKey } from '@/app/shared/lib/web3js-compat';

import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '../../../../../.storybook/decorators';
import {
    INITIAL_VIEWPORTS,
    withMockRpc,
    withViewportFromGlobal,
} from '../../../../../.storybook/responsive-decorators';
import { EPOCH_NEVER_SET } from '../../lib/constants';
import type { StakeAccountInfo, StakeAccountType } from '../../lib/validators';
import { StakeAccountSection } from '../StakeAccountSection';

const STAKE_ACCOUNT_ADDRESS = toLegacyPublicKey(address('5ASxtmcPKDeD8NoE5QpskizPokqDdX1qHFiqZb1spLdo'));
const STAKE_PROGRAM = toLegacyPublicKey(STAKE_PROGRAM_ADDRESS);
const STAKER = address('2xNweLHLKifGNBhLp2giBonGDJ3dPAHpSTaMJmfcMon8');
const WITHDRAWER = address('4TPTXRKCbL39nMkWAtRDMRB4gQkUfrfCMvwKS4AYoH7e');
const VOTER = address('3MRBUAxwx7gWoGvAtzxLtzmhzwPDGAEqStKWb8cJnYQX');
const RENT_RESERVE = 2_282_880n;
const DELEGATED_STAKE = 1_000_000_000n;

const account: Account = {
    data: {},
    executable: false,
    lamports: Number(DELEGATED_STAKE + RENT_RESERVE),
    owner: STAKE_PROGRAM,
    pubkey: STAKE_ACCOUNT_ADDRESS,
    space: 200,
};

const stakeAccount: StakeAccountInfo = {
    meta: {
        authorized: { staker: STAKER, withdrawer: WITHDRAWER },
        lockup: { custodian: STAKE_PROGRAM, epoch: 0, unixTimestamp: 0 },
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

const args = {
    account,
    activation: { active: Number(DELEGATED_STAKE), inactive: 0, state: 'active' as const },
    stakeAccount,
    stakeAccountType: 'delegated' satisfies StakeAccountType,
};

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: StakeAccountSection,
    decorators: [withMockRpc, withViewportFromGlobal, withClusterAndAccounts, withTokenInfoBatch],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs'],
    title: 'Features/Stake/StakeAccountSection/Responsive',
} satisfies Meta<typeof StakeAccountSection>;

export default meta;
type Story = StoryObj<typeof meta>;

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
