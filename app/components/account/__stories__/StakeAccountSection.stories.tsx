import { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { createNextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import type { StakeAccountInfo } from '@validators/accounts/stake';

import { StakeAccountSection } from '../StakeAccountSection';

const STAKE_PUBKEY = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const STAKE_AUTHORITY = new PublicKey('11111111111111111111111111111111');
const WITHDRAW_AUTHORITY = new PublicKey('SysvarRent111111111111111111111111111111111');
const VOTER_PUBKEY = new PublicKey('So11111111111111111111111111111111111111112');

const account: Account = {
    data: {},
    executable: false,
    lamports: 2_500_000_000,
    owner: new PublicKey('Stake11111111111111111111111111111111111111'),
    pubkey: STAKE_PUBKEY,
    space: 200,
};

const baseMeta = {
    authorized: { staker: STAKE_AUTHORITY, withdrawer: WITHDRAW_AUTHORITY },
    lockup: { custodian: STAKE_AUTHORITY, epoch: 0, unixTimestamp: 0 },
    rentExemptReserve: BigInt(2_282_880),
};

const delegatedStake: StakeAccountInfo = {
    meta: baseMeta,
    stake: {
        creditsObserved: 0,
        delegation: {
            activationEpoch: BigInt(120),
            deactivationEpoch: BigInt('0xffffffffffffffff'),
            stake: BigInt(2_000_000_000),
            voter: VOTER_PUBKEY,
            warmupCooldownRate: 0.25,
        },
    },
} as unknown as StakeAccountInfo;

const initializedOnly: StakeAccountInfo = {
    meta: baseMeta,
    stake: null,
} as unknown as StakeAccountInfo;

const meta = {
    component: StakeAccountSection,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    parameters: createNextjsParameters({ query: { cluster: 'devnet' } }),
    tags: ['autodocs'],
    title: 'Components/Account/StakeAccountSection',
} satisfies Meta<typeof StakeAccountSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Delegated: Story = {
    args: {
        account,
        activation: { active: 2_000_000_000, inactive: 0, state: 'active' },
        stakeAccount: delegatedStake,
        stakeAccountType: 'delegated',
    },
};

export const Initialized: Story = {
    args: {
        account,
        stakeAccount: initializedOnly,
        stakeAccountType: 'initialized',
    },
};
