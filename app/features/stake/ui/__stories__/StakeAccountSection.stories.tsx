import { DEFAULT_TIMESTAMP } from '@__fixtures__/gen';
import type { Account } from '@providers/accounts';
import { address } from '@solana/kit';
import { STAKE_PROGRAM_ADDRESS } from '@solana-program/stake';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { toLegacyPublicKey } from '@/app/shared/lib/web3js-compat';

import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '../../../../../.storybook/decorators';
import { withMockRpc } from '../../../../../.storybook/responsive-decorators';
import { EPOCH_NEVER_SET } from '../../lib/constants';
import type { StakeAccountInfo, StakeAccountType } from '../../lib/validators';
import { StakeAccountSection } from '../StakeAccountSection';

// CUSTODIAN sentinel = System Program — convention for "no custodian set" in stake accounts.
const CUSTODIAN = SYSTEM_PROGRAM_ADDRESS;
// Random valid pubkeys used as opaque placeholders in stories.
const STAKE_ACCOUNT_ADDRESS = toLegacyPublicKey(address('5ASxtmcPKDeD8NoE5QpskizPokqDdX1qHFiqZb1spLdo'));
const STAKE_PROGRAM = toLegacyPublicKey(STAKE_PROGRAM_ADDRESS);
const STAKER = address('2xNweLHLKifGNBhLp2giBonGDJ3dPAHpSTaMJmfcMon8');
const WITHDRAWER = address('4TPTXRKCbL39nMkWAtRDMRB4gQkUfrfCMvwKS4AYoH7e');
const VOTER = address('3MRBUAxwx7gWoGvAtzxLtzmhzwPDGAEqStKWb8cJnYQX');

const RENT_RESERVE = 2_282_880n;
const DELEGATED_STAKE = 1_000_000_000n; // 1 SOL

const account: Account = {
    data: {},
    executable: false,
    lamports: Number(DELEGATED_STAKE + RENT_RESERVE),
    owner: STAKE_PROGRAM,
    pubkey: STAKE_ACCOUNT_ADDRESS,
    space: 200,
};

function delegatedStakeInfo(overrides?: {
    activationEpoch?: bigint;
    deactivationEpoch?: bigint;
    lockupTimestamp?: number;
}): StakeAccountInfo {
    return {
        meta: {
            authorized: { staker: STAKER, withdrawer: WITHDRAWER },
            lockup: {
                custodian: CUSTODIAN,
                epoch: 0,
                unixTimestamp: overrides?.lockupTimestamp ?? 0,
            },
            rentExemptReserve: RENT_RESERVE,
        },
        stake: {
            creditsObserved: 12_345,
            delegation: {
                activationEpoch: overrides?.activationEpoch ?? 100n,
                deactivationEpoch: overrides?.deactivationEpoch ?? EPOCH_NEVER_SET,
                stake: DELEGATED_STAKE,
                voter: VOTER,
                warmupCooldownRate: 0.09,
            },
        },
    };
}

function initializedStakeInfo(): StakeAccountInfo {
    return {
        meta: {
            authorized: { staker: STAKER, withdrawer: WITHDRAWER },
            lockup: { custodian: CUSTODIAN, epoch: 0, unixTimestamp: 0 },
            rentExemptReserve: RENT_RESERVE,
        },
        stake: null,
    };
}

const meta = {
    component: StakeAccountSection,
    decorators: [withMockRpc, withClusterAndAccounts, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/Stake/StakeAccountSection',
} satisfies Meta<typeof StakeAccountSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
    args: {
        account,
        activation: { active: Number(DELEGATED_STAKE), inactive: 0, state: 'active' },
        stakeAccount: delegatedStakeInfo(),
        stakeAccountType: 'delegated' satisfies StakeAccountType,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Delegated (active)')).toBeInTheDocument();
        expect(canvas.getByText('Stake Delegation')).toBeInTheDocument();
        expect(canvas.getByText('Authorities')).toBeInTheDocument();
    },
};

export const Activating: Story = {
    args: {
        account,
        // 10% warmed up, rest still activating
        activation: {
            active: Number(DELEGATED_STAKE) / 10,
            inactive: Number(DELEGATED_STAKE * 9n) / 10,
            state: 'activating',
        },
        stakeAccount: delegatedStakeInfo({ activationEpoch: 200n }),
        stakeAccountType: 'delegated',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Delegated (activating)')).toBeInTheDocument();
    },
};

export const Deactivating: Story = {
    args: {
        account,
        // Cooldown in progress — partial active stake remaining
        activation: {
            active: Number(DELEGATED_STAKE) / 2,
            inactive: Number(DELEGATED_STAKE) / 2,
            state: 'deactivating',
        },
        stakeAccount: delegatedStakeInfo({ activationEpoch: 100n, deactivationEpoch: 250n }),
        stakeAccountType: 'delegated',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Delegated (deactivating)')).toBeInTheDocument();
    },
};

export const FullyInactivated: Story = {
    // Fully decayed delegation: deactivation epoch is set and `inactive === delegated.stake`.
    // The section detects this via `isFullyInactivated` and shows "Deactivated" in the overview
    // (distinct from never-delegated states) while hiding the Stake Delegation card entirely.
    args: {
        account,
        activation: { active: 0, inactive: Number(DELEGATED_STAKE), state: 'inactive' },
        stakeAccount: delegatedStakeInfo({ activationEpoch: 100n, deactivationEpoch: 250n }),
        stakeAccountType: 'delegated',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Deactivated')).toBeInTheDocument();
        expect(canvas.queryByText('Stake Delegation')).not.toBeInTheDocument();
    },
};

export const Initialized: Story = {
    // Stake authorities are set but the account has never been delegated (`stake` is null).
    args: {
        account,
        stakeAccount: initializedStakeInfo(),
        stakeAccountType: 'initialized',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Initialized')).toBeInTheDocument();
        expect(canvas.queryByText('Stake Delegation')).not.toBeInTheDocument();
    },
};

export const WithActiveLockup: Story = {
    // Lockup unixTimestamp in the future renders the warning banner above the cards.
    args: {
        account,
        activation: { active: Number(DELEGATED_STAKE), inactive: 0, state: 'active' },
        stakeAccount: delegatedStakeInfo({
            lockupTimestamp: DEFAULT_TIMESTAMP + 60 * 60 * 24 * 365, // 1 year past the fixed reference timestamp
        }),
        stakeAccountType: 'delegated',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Account is locked!')).toBeInTheDocument();
    },
};
