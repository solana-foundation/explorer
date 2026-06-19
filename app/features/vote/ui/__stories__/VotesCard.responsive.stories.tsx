import { nextjsParameters, withCluster } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { VotesCard } from '../VotesCard';
import { BASE_SLOT, voteAccountFixture } from './fixtures';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta: Meta<typeof VotesCard> = {
    component: VotesCard,
    decorators: [withViewportFromGlobal, withCluster],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    // TODO: rename to 'Features/Vote/VotesCard@Media' once we move off Dashkit — keeping the
    // legacy title for now avoids churn in the Storybook tree mid-migration.
    title: 'Components/Account/VotesCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const votes = Array.from({ length: 6 }, (_, i) => ({
    confirmationCount: 31 - i,
    slot: BASE_SLOT + i,
}));

const args = {
    voteAccount: voteAccountFixture(votes),
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
