import { address } from '@solana/kit';
import { nextjsParameters, withCardTableField, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { DetailRow } from '../instructions/DetailRow';
import { VOTE_ACCOUNT_ADDRESS } from './fixtures';

const meta = {
    component: DetailRow,
    decorators: [withViewportFromGlobal, withCardTableField, withTokenInfoBatch],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/Vote/DetailRow@Media',
} satisfies Meta<typeof DetailRow>;

export default meta;
type Story = StoryObj<typeof meta>;

// pubkey row exercises address truncation / right alignment at narrow widths.
const args = { label: 'Vote Account', pubkey: address(VOTE_ACCOUNT_ADDRESS) };

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
