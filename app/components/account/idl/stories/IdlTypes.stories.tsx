import type { Meta, StoryObj } from '@storybook/react';

import { IdlTypesView } from '../formatted-idl/IdlTypes';

const meta = {
    component: IdlTypesView,
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
    title: 'Components/Account/idl/components/IdlTypes',
} satisfies Meta<typeof IdlTypesView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StructTypes: Story = {
    args: {
        data: [
            {
                docs: ['Complete market state'],
                fieldType: {
                    fields: [
                        { name: 'id', type: 'u64' },
                        { name: 'owner', type: 'publicKey' },
                        { docs: ['Market configuration'], name: 'config', type: 'MarketConfig' },
                        { docs: ['Current market status'], name: 'status', type: 'MarketStatus' },
                        { docs: ['Supported tokens'], name: 'tokens', type: 'vec<TokenInfo>' },
                        { docs: ['Market statistics'], name: 'stats', type: 'MarketStats' },
                    ],
                    kind: 'struct',
                },
                name: 'MarketState',
            },
            {
                docs: ['Trading position'],
                fieldType: {
                    fields: [
                        { name: 'id', type: 'u64' },
                        { name: 'owner', type: 'publicKey' },
                        { docs: ['Long or Short'], name: 'side', type: 'PositionSide' },
                        { docs: ['Leverage multiplier'], name: 'leverage', type: 'u8' },
                        { name: 'collateral', type: 'TokenAmount' },
                        { name: 'entryPrice', type: 'u64' },
                        { name: 'liquidationPrice', type: 'u64' },
                    ],
                    kind: 'struct',
                },
                name: 'Position',
            },
        ],
    },
};

export const EnumTypes: Story = {
    args: {
        data: [
            {
                docs: ['Type of order in the system'],
                fieldType: {
                    kind: 'enum',
                    variants: ['Buy', 'Sell', 'Swap'],
                },
                name: 'OrderType',
            },
            {
                docs: ['Result of an action with data'],
                fieldType: {
                    kind: 'enum',
                    variants: [
                        'Success {"txId":"string","timestamp":"i64"}',
                        'Failure {"errorCode":"u16","message":"string"}',
                        'Pending {"id":"u64"}',
                    ],
                },
                name: 'ActionResult',
            },
        ],
    },
};

export const TypeAliases: Story = {
    args: {
        data: [
            {
                docs: ['Alias for balance amount'],
                fieldType: {
                    kind: 'type',
                    name: 'Balance',
                    type: 'u64',
                },
                name: 'Balance',
            },
            {
                docs: ['Token identifier'],
                fieldType: {
                    kind: 'type',
                    name: 'TokenId',
                    type: 'array(u8, 32)',
                },
                name: 'TokenId',
            },
            {
                docs: ['Collection of price points'],
                fieldType: {
                    kind: 'type',
                    name: 'Prices',
                    type: 'vec<u64>',
                },
                name: 'Prices',
            },
        ],
    },
};

export const MixedTypes: Story = {
    args: {
        data: [
            {
                docs: ['Token information'],
                fieldType: {
                    fields: [
                        { name: 'mint', type: 'publicKey' },
                        { name: 'decimals', type: 'u8' },
                        { docs: ['Price oracle'], name: 'oracle', type: 'publicKey' },
                    ],
                    kind: 'struct',
                },
                name: 'TokenInfo',
            },
            {
                docs: ['Type of asset'],
                fieldType: {
                    kind: 'enum',
                    variants: ['Token', 'NFT', 'LP {"poolId":"publicKey"}'],
                },
                name: 'AssetType',
            },
            {
                docs: ['Unix timestamp in seconds'],
                fieldType: {
                    kind: 'type',
                    name: 'Timestamp',
                    type: 'i64',
                },
                name: 'Timestamp',
            },
            {
                docs: ['Wallet address'],
                fieldType: {
                    kind: 'type',
                    name: 'Address',
                    type: 'publicKey',
                },
                name: 'Address',
            },
        ],
    },
};

export const UnknownTypes: Story = {
    args: {
        data: [
            {
                docs: ['Type with unknown format'],
                fieldType: {
                    kind: 'unknown',
                    type: 'custom<ExternalType>(param1, param2)',
                },
                name: 'ComplexType',
            },
        ],
    },
};

export const NoTypes: Story = {
    args: {
        data: [],
    },
};
