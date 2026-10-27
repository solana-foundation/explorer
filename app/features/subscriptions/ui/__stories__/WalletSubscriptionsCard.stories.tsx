import { gen } from '@__fixtures__/gen';
import {
    FIXED_DELEGATION,
    PLAN,
    RECURRING_DELEGATION,
    SUBSCRIPTION_DELEGATION,
} from '@features/subscriptions/__fixtures__/subscriptions-accounts';
import { address } from '@solana/kit';
import { withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import { withMockRpc } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { WalletSubscriptionsView } from '../WalletSubscriptionsCard';

const PLAN_ACCOUNT = address(gen.address(0));
const SUB_ACCOUNT = address(gen.address(4));
const FIXED_ACCOUNT = address(gen.address(5));
const RECURRING_ACCOUNT = address(gen.address(6));
const RECV_SUB_ACCOUNT = address(gen.address(7));
const RECV_FIXED_ACCOUNT = address(gen.address(8));

const ALL_DATA = {
    delegations: [
        { address: SUB_ACCOUNT, data: SUBSCRIPTION_DELEGATION, kind: 'subscription' as const },
        { address: FIXED_ACCOUNT, data: FIXED_DELEGATION, kind: 'fixed' as const },
        { address: RECURRING_ACCOUNT, data: RECURRING_DELEGATION, kind: 'recurring' as const },
    ],
    delegationsReceived: [
        { address: RECV_SUB_ACCOUNT, data: SUBSCRIPTION_DELEGATION, kind: 'subscription' as const },
        { address: RECV_FIXED_ACCOUNT, data: FIXED_DELEGATION, kind: 'fixed' as const },
    ],
    plans: [{ address: PLAN_ACCOUNT, data: PLAN }],
};

const meta = {
    component: WalletSubscriptionsView,
    decorators: [withMockRpc, withClusterAndAccounts, withTokenInfoBatch],
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
        delegationsReceived: [
            { address: RECV_SUB_ACCOUNT, data: SUBSCRIPTION_DELEGATION, kind: 'subscription' as const },
        ],
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
        delegations: [{ address: SUB_ACCOUNT, data: SUBSCRIPTION_DELEGATION, kind: 'subscription' as const }],
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
