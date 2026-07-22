import { gen } from '@__fixtures__/gen';
import { address } from '@solana/kit';
import {
    AccountDiscriminator,
    type FixedDelegation,
    type Plan,
    PlanStatus,
    type RecurringDelegation,
    type SubscriptionDelegation,
} from '@solana/subscriptions';
import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import { withMockRpc } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { WalletSubscriptionsView } from '../WalletSubscriptionsCard';

const ZERO = address('11111111111111111111111111111111');
const PLAN_ACCOUNT = address(gen.address(0));
const SUB_ACCOUNT = address(gen.address(1));
const FIXED_ACCOUNT = address(gen.address(2));
const RECURRING_ACCOUNT = address(gen.address(3));
const USER = address(gen.address(4));
const MINT = address(gen.address(5));
const DELEGATEE = address(gen.address(6));
const RECV_SUB_ACCOUNT = address(gen.address(7));
const RECV_FIXED_ACCOUNT = address(gen.address(8));

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

const ALL_DATA = {
    delegations: [
        { address: SUB_ACCOUNT, data: SUB_DELEGATION, kind: 'subscription' as const },
        { address: FIXED_ACCOUNT, data: FIXED_DELEGATION, kind: 'fixed' as const },
        { address: RECURRING_ACCOUNT, data: RECURRING_DELEGATION, kind: 'recurring' as const },
    ],
    delegationsReceived: [
        { address: RECV_SUB_ACCOUNT, data: SUB_DELEGATION, kind: 'subscription' as const },
        { address: RECV_FIXED_ACCOUNT, data: FIXED_DELEGATION, kind: 'fixed' as const },
    ],
    plans: [{ address: PLAN_ACCOUNT, data: PLAN }],
};

const meta = {
    component: WalletSubscriptionsView,
    decorators: [withMockRpc, withClusterAndAccounts, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/Subscriptions/WalletSubscriptionsCard',
} satisfies Meta<typeof WalletSubscriptionsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllSections: Story = {
    args: ALL_DATA,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Plans')).toBeInTheDocument();
        expect(canvas.getByText('Subscriptions')).toBeInTheDocument();
        expect(canvas.getByText('Delegations')).toBeInTheDocument();
        expect(canvas.getByText('Received Subscriptions')).toBeInTheDocument();
        expect(canvas.getByText('Received Delegations')).toBeInTheDocument();
        // Plan id / amount are unique to the Plans section; 'Recurring' only appears in own
        // Delegations. (Amounts like 200000/500000 repeat across own + received rows.)
        expect(canvas.getByText('42')).toBeInTheDocument();
        expect(canvas.getByText('1000000')).toBeInTheDocument();
        expect(canvas.getByText('Recurring')).toBeInTheDocument();
    },
};

export const ReceivedSubscriptionsOnly: Story = {
    args: {
        delegations: [],
        delegationsReceived: [{ address: RECV_SUB_ACCOUNT, data: SUB_DELEGATION, kind: 'subscription' as const }],
        plans: [],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Regression: a wallet with only received subscription-kind delegations must render
        // content, not the "No subscriptions found" empty state (tab/page mismatch).
        expect(canvas.getByText('Received Subscriptions')).toBeInTheDocument();
        expect(canvas.queryByText('No subscriptions found for this address.')).not.toBeInTheDocument();
    },
};

export const PlansOnly: Story = {
    args: { delegations: [], delegationsReceived: [], plans: ALL_DATA.plans },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Plans')).toBeInTheDocument();
        expect(canvas.queryByText('Subscriptions')).not.toBeInTheDocument();
        expect(canvas.queryByText('Delegations')).not.toBeInTheDocument();
    },
};

export const SubscriptionsOnly: Story = {
    args: {
        delegations: [{ address: SUB_ACCOUNT, data: SUB_DELEGATION, kind: 'subscription' as const }],
        delegationsReceived: [],
        plans: [],
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
        delegations: [
            { address: FIXED_ACCOUNT, data: FIXED_DELEGATION, kind: 'fixed' as const },
            { address: RECURRING_ACCOUNT, data: RECURRING_DELEGATION, kind: 'recurring' as const },
        ],
        delegationsReceived: [],
        plans: [],
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

export const Empty: Story = {
    args: { delegations: [], delegationsReceived: [], plans: [] },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('No subscriptions found for this address.')).toBeInTheDocument();
    },
};
