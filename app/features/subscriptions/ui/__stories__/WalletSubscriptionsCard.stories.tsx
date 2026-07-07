import { address } from '@solana/kit';
import {
    AccountDiscriminator,
    type FixedDelegation,
    type Plan,
    PlanStatus,
    type RecurringDelegation,
    type SubscriptionDelegation,
} from '@solana/subscriptions';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '../../../../../.storybook/decorators';
import { withMockRpc } from '../../../../../.storybook/responsive-decorators';
import { WalletSubscriptionsView } from '../WalletSubscriptionsCard';

// ─── Shared constants ─────────────────────────────────────────────────────────

const ZERO = address('11111111111111111111111111111111');
const PLAN_ACCOUNT = address('5ASxtmcPKDeD8NoE5QpskizPokqDdX1qHFiqZb1spLdo');
const SUB_ACCOUNT = address('7NKXbdLz6dSzUqnKSCGE8DXDYM5cGGnMDamU1MNjBvz');
const FIXED_ACCOUNT = address('9VHSuHkxAoMT1Pxb3VqDWvbPGbmT6AMz5rNEYGcqKh4');
const RECURRING_ACCOUNT = address('BkBm9VkHR7ZdCT5SKhT5MJXDVNmNRmhzWB8FTJNMpqrX');
const USER = address('2xNweLHLKifGNBhLp2giBonGDJ3dPAHpSTaMJmfcMon8');
const MINT = address('4TPTXRKCbL39nMkWAtRDMRB4gQkUfrfCMvwKS4AYoH7e');
const DELEGATEE = address('3MRBUAxwx7gWoGvAtzxLtzmhzwPDGAEqStKWb8cJnYQX');

// ─── Fixture data ─────────────────────────────────────────────────────────────

const HEADER_BASE = {
    delegatee: DELEGATEE,
    delegator: USER,
    payer: ZERO,
    version: 1,
};

const PLAN: Plan = {
    bump: 255,
    data: {
        destinations: [ZERO, ZERO, ZERO, ZERO],
        endTs: 0n,
        metadataUri: '',
        mint: MINT,
        planId: 42n,
        pullers: [ZERO, ZERO, ZERO, ZERO],
        terms: { amount: 1_000_000n, createdAt: 0n, periodHours: 24n },
    },
    discriminator: AccountDiscriminator.Plan,
    owner: USER,
    status: PlanStatus.Active,
};

const SUB_DELEGATION: SubscriptionDelegation = {
    amountPulledInPeriod: 50_000n,
    currentPeriodStartTs: 1_700_000_000n,
    expiresAtTs: 1_999_999_999n,
    header: { ...HEADER_BASE, bump: 251, discriminator: AccountDiscriminator.SubscriptionDelegation, initId: 3n },
    terms: { amount: 200_000n, createdAt: 0n, periodHours: 48n },
};

const FIXED_DELEGATION: FixedDelegation = {
    amount: 500_000n,
    expiryTs: 1_999_999_999n,
    header: { ...HEADER_BASE, bump: 253, discriminator: AccountDiscriminator.FixedDelegation, initId: 1n },
    mint: MINT,
    subscriptionAuthority: ZERO,
};

const RECURRING_DELEGATION: RecurringDelegation = {
    amountPerPeriod: 100_000n,
    amountPulledInPeriod: 25_000n,
    currentPeriodStartTs: 1_700_000_000n,
    expiryTs: 1_999_999_999n,
    header: { ...HEADER_BASE, bump: 252, discriminator: AccountDiscriminator.RecurringDelegation, initId: 2n },
    mint: MINT,
    periodLengthS: 86_400n,
    subscriptionAuthority: ZERO,
};

// ─── Mock WalletSubscriptionsData ─────────────────────────────────────────────

const ALL_DATA = {
    delegations: [
        { address: SUB_ACCOUNT, data: SUB_DELEGATION, kind: 'subscription' as const },
        { address: FIXED_ACCOUNT, data: FIXED_DELEGATION, kind: 'fixed' as const },
        { address: RECURRING_ACCOUNT, data: RECURRING_DELEGATION, kind: 'recurring' as const },
    ],
    plans: [{ address: PLAN_ACCOUNT, data: PLAN }],
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    component: WalletSubscriptionsView,
    decorators: [withMockRpc, withClusterAndAccounts, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/Subscriptions/WalletSubscriptionsCard',
} satisfies Meta<typeof WalletSubscriptionsView>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const AllSections: Story = {
    args: { data: ALL_DATA },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Plans')).toBeInTheDocument();
        expect(canvas.getByText('Subscriptions')).toBeInTheDocument();
        expect(canvas.getByText('Delegations')).toBeInTheDocument();
        expect(canvas.getByText('42')).toBeInTheDocument();
        expect(canvas.getByText('1000000')).toBeInTheDocument();
        expect(canvas.getByText('200000')).toBeInTheDocument();
        expect(canvas.getByText('Fixed')).toBeInTheDocument();
        expect(canvas.getByText('Recurring')).toBeInTheDocument();
    },
};

export const PlansOnly: Story = {
    args: { data: { delegations: [], plans: ALL_DATA.plans } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Plans')).toBeInTheDocument();
        expect(canvas.queryByText('Subscriptions')).not.toBeInTheDocument();
        expect(canvas.queryByText('Delegations')).not.toBeInTheDocument();
    },
};

export const SubscriptionsOnly: Story = {
    args: {
        data: {
            delegations: [{ address: SUB_ACCOUNT, data: SUB_DELEGATION, kind: 'subscription' as const }],
            plans: [],
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.queryByText('Plans')).not.toBeInTheDocument();
        expect(canvas.getByText('Subscriptions')).toBeInTheDocument();
        expect(canvas.getByText('48 hours')).toBeInTheDocument();
    },
};

export const DelegationsOnly: Story = {
    args: {
        data: {
            delegations: [
                { address: FIXED_ACCOUNT, data: FIXED_DELEGATION, kind: 'fixed' as const },
                { address: RECURRING_ACCOUNT, data: RECURRING_DELEGATION, kind: 'recurring' as const },
            ],
            plans: [],
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.queryByText('Plans')).not.toBeInTheDocument();
        expect(canvas.queryByText('Subscriptions')).not.toBeInTheDocument();
        expect(canvas.getByText('Delegations')).toBeInTheDocument();
        expect(canvas.getByText('Fixed')).toBeInTheDocument();
        expect(canvas.getByText('Recurring')).toBeInTheDocument();
        expect(canvas.getByText('500000')).toBeInTheDocument();
        expect(canvas.getByText('100000')).toBeInTheDocument();
    },
};
