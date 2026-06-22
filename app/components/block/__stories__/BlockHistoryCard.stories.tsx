import type { VersionedBlockResponse } from '@solana/web3.js';
import { nextjsParameters, withCluster } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BlockHistoryCard } from '../BlockHistoryCard';

// Real block decoding requires a fully-formed VersionedBlockResponse with compiled instructions,
// account keys, and meta — heavy fixture work. Empty-transactions case exercises the
// "no transactions" ErrorCard fallback and is the natural prop-driven story for this card.
const emptyBlock = {
    blockTime: null,
    blockhash: 'GnPnX9Y6w6vYi3iWQGfh',
    parentSlot: 0,
    previousBlockhash: 'GnPnX9Y6w6vYi3iWQGfh',
    transactions: [],
} as unknown as VersionedBlockResponse;

const meta = {
    component: BlockHistoryCard,
    decorators: [withCluster],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Block/BlockHistoryCard',
} satisfies Meta<typeof BlockHistoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyBlock: Story = {
    args: { block: emptyBlock, epoch: 500n },
};
