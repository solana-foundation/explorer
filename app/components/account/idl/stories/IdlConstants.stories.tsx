import type { Meta, StoryObj } from '@storybook/react';

import { IdlConstantsView } from '../formatted-idl/IdlConstants';

const meta = {
    component: IdlConstantsView,
    decorators: [
        Story => (
            <div>
                <Story />
            </div>
        ),
    ],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/idl/components/IdlConstants',
} satisfies Meta<typeof IdlConstantsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NumericConstants: Story = {
    args: {
        data: [
            {
                docs: ['Maximum number of users allowed'],
                name: 'MAX_USERS',
                type: 'u16',
                value: '1000',
            },
            {
                docs: ['Minimum deposit amount in lamports'],
                name: 'MIN_DEPOSIT',
                type: 'u64',
                value: '10000000',
            },
            {
                docs: ['Protocol fee in basis points'],
                name: 'PROTOCOL_FEE',
                type: 'u16',
                value: '25',
            },
        ],
    },
};

export const MixedTypeConstants: Story = {
    args: {
        data: [
            {
                docs: ['Current version of the program'],
                name: 'PROGRAM_VERSION',
                type: 'string',
                value: '"1.2.3"',
            },
            {
                docs: ['Flag indicating if program is on mainnet'],
                name: 'IS_MAINNET',
                type: 'bool',
                value: 'true',
            },
            {
                docs: ['Default admin public key'],
                name: 'DEFAULT_ADMIN',
                type: 'publicKey',
                value: '"8xyk98qMVp3S9qMACiV5PgmHn3qzPiT6SMfk3Hz6yyKz"',
            },
            {
                docs: ['Default lock duration in seconds'],
                name: 'LOCK_DURATION',
                type: 'i64',
                value: '604800',
            },
        ],
    },
};

export const ArrayConstants: Story = {
    args: {
        data: [
            {
                docs: ['List of allowed token mints'],
                name: 'ALLOWED_MINTS',
                type: 'array(publicKey, 3)',
                value: '["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v","4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU","7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs"]',
            },
        ],
    },
};

export const NoConstants: Story = {
    args: {
        data: [],
    },
};
