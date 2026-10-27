import {
    FIXED_DELEGATION_BYTES,
    PLAN_BYTES,
    RECURRING_DELEGATION_BYTES,
    SUBSCRIPTION_AUTHORITY_BYTES,
    SUBSCRIPTION_DELEGATION_BYTES,
    subscriptionsAccount,
} from '@features/subscriptions/__fixtures__/subscriptions-accounts';
import { withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import { withMockRpc } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { SubscriptionsAccountCard } from '../SubscriptionsAccountCard';

const meta = {
    component: SubscriptionsAccountCard,
    decorators: [withMockRpc, withClusterAndAccounts, withTokenInfoBatch],
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
        account: subscriptionsAccount(PLAN_BYTES),
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
        account: subscriptionsAccount(SUBSCRIPTION_AUTHORITY_BYTES),
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
        account: subscriptionsAccount(FIXED_DELEGATION_BYTES),
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
        account: subscriptionsAccount(RECURRING_DELEGATION_BYTES),
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
        account: subscriptionsAccount(SUBSCRIPTION_DELEGATION_BYTES),
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
