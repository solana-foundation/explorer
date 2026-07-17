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
import { INITIAL_VIEWPORTS, withMockRpc, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { WalletSubscriptionsView } from '../WalletSubscriptionsCard';

const ZERO = address('11111111111111111111111111111111');
const PLAN_ACCOUNT = address(gen.address(0));
const SUB_ACCOUNT = address(gen.address(1));
const FIXED_ACCOUNT = address(gen.address(2));
const RECURRING_ACCOUNT = address(gen.address(3));
const USER = address(gen.address(4));
const MINT = address(gen.address(5));
const DELEGATEE = address(gen.address(6));

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

const args = {
    delegations: [
        { address: SUB_ACCOUNT, data: SUB_DELEGATION, kind: 'subscription' as const },
        { address: FIXED_ACCOUNT, data: FIXED_DELEGATION, kind: 'fixed' as const },
        { address: RECURRING_ACCOUNT, data: RECURRING_DELEGATION, kind: 'recurring' as const },
    ],
    delegationsReceived: [],
    plans: [{ address: PLAN_ACCOUNT, data: PLAN }],
};

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: WalletSubscriptionsView,
    decorators: [withMockRpc, withViewportFromGlobal, withClusterAndAccounts, withTokenInfoBatch],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/Subscriptions/WalletSubscriptionsCard@Media',
} satisfies Meta<typeof WalletSubscriptionsView>;

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
