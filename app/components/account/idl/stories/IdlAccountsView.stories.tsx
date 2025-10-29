import type { Meta, StoryObj } from '@storybook/react';

import { IdlAccountsView } from '../formatted-idl/IdlAccounts';

const meta = {
    component: IdlAccountsView,
    decorators: [
        Story => (
            <div>
                <Story />
            </div>
        ),
    ],
    parameters: {
        nextjs: {
            appDirectory: true,
        },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/idl/components/IdlAccounts',
} satisfies Meta<typeof IdlAccountsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SimpleAccounts: Story = {
    args: {
        data: [
            {
                docs: ['Stores user information and balance'],
                fieldType: {
                    fields: [
                        { name: 'owner', type: 'publicKey' },
                        { name: 'balance', type: 'u64' },
                        { name: 'active', type: 'bool' },
                    ],
                    kind: 'struct',
                },
                name: 'UserAccount',
            },
            {
                docs: [],
                fieldType: {
                    fields: [
                        { name: 'authority', type: 'publicKey' },
                        { name: 'treasury', type: 'publicKey' },
                        { name: 'feePercent', type: 'u16' },
                    ],
                    kind: 'struct',
                },
                name: 'MarketplaceAccount',
            },
        ],
    },
};

export const AccountsWithDocs: Story = {
    args: {
        data: [
            {
                docs: ['Program state account with complex fields'],
                fieldType: {
                    fields: [
                        { name: 'admin', type: 'publicKey' },
                        { docs: ['Configuration settings'], name: 'settings', type: 'SettingsType' },
                        { docs: ['Current program status'], name: 'status', type: 'StatusEnum' },
                    ],
                    kind: 'struct',
                },
                name: 'StateAccount',
            },
            {
                docs: ['Vault that holds assets'],
                fieldType: {
                    fields: [
                        { name: 'owner', type: 'publicKey' },
                        { docs: ['List of all tokens'], name: 'tokens', type: 'vec(TokenInfo)' },
                        { docs: ['Timestamp when assets unlock'], name: 'lockedUntil', type: 'i64' },
                    ],
                    kind: 'struct',
                },
                name: 'VaultAccount',
            },
        ],
    },
};

export const EnumAccount: Story = {
    args: {
        data: [
            {
                docs: ['Possible market states'],
                fieldType: {
                    kind: 'enum',
                    variants: [
                        'Open',
                        'Closed',
                        'Suspended',
                        'PendingApproval {"requestedBy":"publicKey","timestamp":"i64"}',
                    ],
                },
                name: 'MarketState',
            },
        ],
    },
};

export const TypeAccount: Story = {
    args: {
        data: [
            {
                docs: ['Custom token pair definition'],
                fieldType: {
                    kind: 'type',
                    name: 'TokenPair',
                    type: 'array(publicKey, 2)',
                },
                name: 'TokenPair',
            },
        ],
    },
};

export const UnknownTypeAccount: Story = {
    args: {
        data: [
            {
                docs: ['Unknown account that is just JSON.'],
                fieldType: {
                    kind: 'unknown',
                    type: '{"mint":"pubkey","amount":"u64"}',
                },
                name: 'UnknownType',
            },
        ],
    },
};

export const NoAccounts: Story = {
    args: {
        data: [],
    },
};
