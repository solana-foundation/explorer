import type { BlockWithV1 } from '@entities/block-data';
import { PublicKey } from '@solana/web3.js';
import { nextjsParameters, withClusterAccountsAndTokenInfo } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BlockOverviewCard } from '../BlockOverviewCard';

// Real block decoding needs a fully-formed VersionedBlockResponse with compiled instructions and
// meta (heavy fixture work), but the Overview only reads block-level fields plus tx meta totals, so
// an empty `transactions` list renders every always-on row (compute totals resolve to 0).
const baseBlock = {
    blockTime: 1_700_000_000,
    blockhash: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
    parentSlot: 426014006,
    previousBlockhash: 'GfR1o2b8mVCg1KYp2f8vXbNqvY9dQyv2n8VnQyJc5Uab',
    transactions: [],
} as unknown as BlockWithV1;

const LEADER = new PublicKey('So11111111111111111111111111111111111111112');
const PARENT_LEADER = new PublicKey('Vote111111111111111111111111111111111111111');
const CHILD_LEADER = new PublicKey('Stake11111111111111111111111111111111111111');

const meta = {
    component: BlockOverviewCard,
    decorators: [withClusterAccountsAndTokenInfo],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Block/BlockOverviewCard',
} satisfies Meta<typeof BlockOverviewCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        block: baseBlock,
        blockLeader: LEADER,
        childLeader: CHILD_LEADER,
        childSlot: 426014008,
        epoch: 500n,
        parentLeader: PARENT_LEADER,
        slot: 426014007,
    },
};

export const NoTimestamp: Story = {
    args: {
        ...Default.args,
        block: { ...baseBlock, blockTime: null } as unknown as BlockWithV1,
    },
};

export const MinimalNoLeaders: Story = {
    args: {
        block: baseBlock,
        epoch: 500n,
        slot: 426014007,
    },
};
