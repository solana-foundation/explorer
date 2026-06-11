import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withMockRpc, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { VoteAccountSection } from '../VoteAccountSection';
import { accountFixture, BASE_SLOT, voteAccountV4Fixture } from './fixtures';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: VoteAccountSection,
    decorators: [withMockRpc, withViewportFromGlobal, withClusterAndAccounts, withTokenInfoBatch],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/Vote/VoteAccountSection/Responsive',
} satisfies Meta<typeof VoteAccountSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    account: accountFixture(),
    voteAccount: voteAccountV4Fixture([{ confirmationCount: 31, slot: BASE_SLOT }]),
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
