import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCardTableField } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { VoteStateRows } from '../instructions/VoteStateRows';
import { BASE_SLOT, HASH, TIMESTAMP } from './fixtures';

const meta = {
    component: VoteStateRows,
    decorators: [withViewportFromGlobal, withCardTableField],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/Vote/VoteStateRows/Responsive',
} satisfies Meta<typeof VoteStateRows>;

export default meta;
type Story = StoryObj<typeof meta>;

// Full payload exercises hash-row and lockout-block wrapping at narrow widths.
const args = {
    voteState: {
        blockId: HASH,
        hash: HASH,
        lockouts: [
            { confirmation_count: 31, slot: BASE_SLOT },
            { confirmation_count: 30, slot: BASE_SLOT + 1 },
            { confirmation_count: 29, slot: BASE_SLOT + 2 },
        ],
        root: BASE_SLOT - 1,
        timestamp: TIMESTAMP,
    },
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
