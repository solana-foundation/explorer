import {
    nextjsParameters,
    withMockTransactions,
    withScrollAnchor,
    withTokenInfoBatch,
} from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { VoteDetailsCard } from '../instructions/VoteDetailsCard';
import {
    BASE_SLOT,
    HASH,
    TIMESTAMP,
    VOTE_ACCOUNT_ADDRESS,
    VOTE_AUTHORITY_ADDRESS,
    voteParsedInstruction,
    voteParsedTransaction,
} from './fixtures';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: VoteDetailsCard,
    decorators: [withViewportFromGlobal, withMockTransactions, withScrollAnchor, withTokenInfoBatch],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/Vote/VoteDetailsCard@Media',
} satisfies Meta<typeof VoteDetailsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const towerSyncIx = voteParsedInstruction({
    info: {
        towerSync: {
            blockId: HASH,
            hash: HASH,
            lockouts: [
                { confirmation_count: 31, slot: BASE_SLOT },
                { confirmation_count: 30, slot: BASE_SLOT + 1 },
            ],
            root: BASE_SLOT - 1,
            timestamp: TIMESTAMP,
        },
        voteAccount: VOTE_ACCOUNT_ADDRESS,
        voteAuthority: VOTE_AUTHORITY_ADDRESS,
    },
    type: 'towersync',
});

const args = {
    index: 0,
    ix: towerSyncIx,
    result: { err: null },
    tx: voteParsedTransaction(towerSyncIx),
};

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
