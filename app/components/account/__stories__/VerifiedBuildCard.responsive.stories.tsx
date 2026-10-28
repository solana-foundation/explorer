import { withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseVerifiedBuildCard } from '../VerifiedBuildCard';
import * as Base from './VerifiedBuildCard.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: BaseVerifiedBuildCard,
    decorators: [withViewportFromGlobal, withClusterAndAccounts, withTokenInfoBatch],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/VerifiedBuildCard@Media',
} satisfies Meta<typeof BaseVerifiedBuildCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.Verified.args;

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
