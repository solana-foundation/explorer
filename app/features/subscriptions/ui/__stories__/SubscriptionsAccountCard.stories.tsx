import type { Account } from '@providers/accounts';
import { address } from '@solana/kit';
import {
    AccountDiscriminator,
    getFixedDelegationEncoder,
    getPlanEncoder,
    getRecurringDelegationEncoder,
    getSubscriptionAuthorityEncoder,
    getSubscriptionDelegationEncoder,
    PlanStatus,
    SUBSCRIPTIONS_PROGRAM_ADDRESS,
} from '@solana/subscriptions';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { toLegacyPublicKey } from '@/app/shared/lib/web3js-compat';

import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '../../../../../.storybook/decorators';
import { withMockRpc } from '../../../../../.storybook/responsive-decorators';
import { SubscriptionsAccountCard } from '../SubscriptionsAccountCard';

const ZERO = address('11111111111111111111111111111111');
const PROGRAM_OWNER = toLegacyPublicKey(address(SUBSCRIPTIONS_PROGRAM_ADDRESS));
const ACCOUNT_ADDRESS = toLegacyPublicKey(address('5ASxtmcPKDeD8NoE5QpskizPokqDdX1qHFiqZb1spLdo'));
const USER = address('2xNweLHLKifGNBhLp2giBonGDJ3dPAHpSTaMJmfcMon8');
const MINT = address('4TPTXRKCbL39nMkWAtRDMRB4gQkUfrfCMvwKS4AYoH7e');
const DELEGATEE = address('3MRBUAxwx7gWoGvAtzxLtzmhzwPDGAEqStKWb8cJnYQX');

function encode<T>(encoder: { encode: (v: T) => unknown }, value: T): Uint8Array {
    return encoder.encode(value) as unknown as Uint8Array;
}

const PLAN_BYTES = encode(getPlanEncoder(), {
    bump: 255,
    data: {
        destinations: [ZERO, ZERO, ZERO, ZERO],
        endTs: 0n,
        metadataUri: 'https://example.com/plan.json',
        mint: MINT,
        planId: 42n,
        pullers: [ZERO, ZERO, ZERO, ZERO],
        terms: { amount: 1_000_000n, createdAt: 0n, periodHours: 24n },
    },
    discriminator: AccountDiscriminator.Plan,
    owner: USER,
    status: PlanStatus.Active,
});

const SUBSCRIPTION_AUTHORITY_BYTES = encode(getSubscriptionAuthorityEncoder(), {
    bump: 254,
    discriminator: AccountDiscriminator.SubscriptionAuthority,
    initId: 7n,
    payer: ZERO,
    tokenMint: MINT,
    user: USER,
});

const FIXED_DELEGATION_BYTES = encode(getFixedDelegationEncoder(), {
    amount: 500_000n,
    expiryTs: 1_999_999_999n,
    header: {
        bump: 253,
        delegatee: DELEGATEE,
        delegator: USER,
        discriminator: AccountDiscriminator.FixedDelegation,
        initId: 1n,
        payer: ZERO,
        version: 1,
    },
    mint: MINT,
    subscriptionAuthority: ZERO,
});

const RECURRING_DELEGATION_BYTES = encode(getRecurringDelegationEncoder(), {
    amountPerPeriod: 100_000n,
    amountPulledInPeriod: 25_000n,
    currentPeriodStartTs: 1_700_000_000n,
    expiryTs: 1_999_999_999n,
    header: {
        bump: 252,
        delegatee: DELEGATEE,
        delegator: USER,
        discriminator: AccountDiscriminator.RecurringDelegation,
        initId: 2n,
        payer: ZERO,
        version: 1,
    },
    mint: MINT,
    periodLengthS: 86_400n,
    subscriptionAuthority: ZERO,
});

const SUBSCRIPTION_DELEGATION_BYTES = encode(getSubscriptionDelegationEncoder(), {
    amountPulledInPeriod: 50_000n,
    currentPeriodStartTs: 1_700_000_000n,
    expiresAtTs: 1_999_999_999n,
    header: {
        bump: 251,
        delegatee: DELEGATEE,
        delegator: USER,
        discriminator: AccountDiscriminator.SubscriptionDelegation,
        initId: 3n,
        payer: ZERO,
        version: 1,
    },
    terms: { amount: 200_000n, createdAt: 0n, periodHours: 48n },
});

function makeAccount(raw: Uint8Array): Account {
    return {
        data: { raw },
        executable: false,
        lamports: 1_000_000,
        owner: PROGRAM_OWNER,
        pubkey: ACCOUNT_ADDRESS,
        space: raw.length,
    };
}

const meta = {
    component: SubscriptionsAccountCard,
    decorators: [withMockRpc, withClusterAndAccounts, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/Subscriptions/SubscriptionsAccountCard',
} satisfies Meta<typeof SubscriptionsAccountCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const onNotFound = () => {
    throw new Error('onNotFound called unexpectedly');
};

export const Plan: Story = {
    args: {
        account: makeAccount(PLAN_BYTES),
        onNotFound,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Subscription Plan')).toBeInTheDocument();
        expect(canvas.getByText('42')).toBeInTheDocument();
        expect(canvas.getByText('Active')).toBeInTheDocument();
        expect(canvas.getByText('1000000')).toBeInTheDocument();
        expect(canvas.getByText('24 hours')).toBeInTheDocument();
    },
};

export const SubscriptionAuthority: Story = {
    args: {
        account: makeAccount(SUBSCRIPTION_AUTHORITY_BYTES),
        onNotFound,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Subscription Authority')).toBeInTheDocument();
        expect(canvas.getByText('7')).toBeInTheDocument();
    },
};

export const FixedDelegation: Story = {
    args: {
        account: makeAccount(FIXED_DELEGATION_BYTES),
        onNotFound,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Fixed Delegation')).toBeInTheDocument();
        expect(canvas.getByText('500000')).toBeInTheDocument();
    },
};

export const RecurringDelegation: Story = {
    args: {
        account: makeAccount(RECURRING_DELEGATION_BYTES),
        onNotFound,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Recurring Delegation')).toBeInTheDocument();
        expect(canvas.getByText('100000')).toBeInTheDocument();
        expect(canvas.getByText('86400 seconds')).toBeInTheDocument();
        expect(canvas.getByText('25000')).toBeInTheDocument();
    },
};

export const SubscriptionDelegation: Story = {
    args: {
        account: makeAccount(SUBSCRIPTION_DELEGATION_BYTES),
        onNotFound,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Subscription Delegation')).toBeInTheDocument();
        expect(canvas.getByText('200000')).toBeInTheDocument();
        expect(canvas.getByText('48 hours')).toBeInTheDocument();
        expect(canvas.getByText('50000')).toBeInTheDocument();
    },
};
