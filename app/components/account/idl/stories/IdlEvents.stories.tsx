import type { Meta, StoryObj } from '@storybook/react';

import { IdlEventsView } from '../formatted-idl/IdlEvents';

const meta = {
    component: IdlEventsView,
    decorators: [
        Story => (
            <div>
                <Story />
            </div>
        ),
    ],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/idl/components/IdlEvents',
} satisfies Meta<typeof IdlEventsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicEvents: Story = {
    args: {
        data: [
            {
                docs: ['Emitted when an NFT is sold on the marketplace'],
                fieldType: {
                    fields: [
                        { docs: ['NFT mint address'], name: 'tokenMint', type: 'publicKey' },
                        { name: 'seller', type: 'publicKey' },
                        { name: 'buyer', type: 'publicKey' },
                        { docs: ['Sale price in lamports'], name: 'price', type: 'u64' },
                        { docs: ['Royalties paid in lamports'], name: 'royalties', type: 'u64' },
                        { name: 'marketplace', type: 'publicKey' },
                        { name: 'platformFee', type: 'u64' },
                    ],
                    kind: 'struct',
                },
                name: 'MarketItemSold',
            },
            {
                docs: [],
                fieldType: {
                    fields: [
                        { name: 'auctionId', type: 'u64' },
                        { name: 'tokenMint', type: 'publicKey' },
                        { name: 'winner', type: 'publicKey' },
                        { name: 'finalPrice', type: 'u64' },
                        { name: 'participants', type: 'vec(publicKey)' },
                        { name: 'endTime', type: 'i64' },
                    ],
                    kind: 'struct',
                },
                name: 'AuctionCompleted',
            },
        ],
    },
};

export const EnumEvents: Story = {
    args: {
        data: [
            {
                docs: ['Emitted when a governance action is performed'],
                fieldType: {
                    kind: 'enum',
                    variants: [
                        'ProposalCreated {"proposer":"publicKey","description":"string"}',
                        'VoteCast {"voter":"publicKey","support":"bool","power":"u64"}',
                        'ProposalExecuted {"executor":"publicKey"}',
                        'ProposalCancelled {"canceler":"publicKey","reason":"string"}',
                    ],
                },
                name: 'GovernanceAction',
            },
        ],
    },
};

export const TypeEvents: Story = {
    args: {
        data: [
            {
                docs: ['System-level event'],
                fieldType: {
                    kind: 'type',
                    type: 'string',
                },
                name: 'SystemMessage',
            },
        ],
    },
};

export const NoEvents: Story = {
    args: {
        data: [],
    },
};
