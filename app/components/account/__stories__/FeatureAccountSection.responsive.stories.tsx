import { withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { FeatureAccountSection } from '../FeatureAccountSection';
import * as Base from './FeatureAccountSection.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: FeatureAccountSection,
    decorators: [withClusterAndAccounts, withTokenInfoBatch, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/FeatureAccountSection@Media',
} satisfies Meta<typeof FeatureAccountSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.UnknownFeatureAccount.args;

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
