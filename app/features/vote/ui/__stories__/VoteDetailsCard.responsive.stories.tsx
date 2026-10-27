import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { VoteDetailsCard } from '../instructions/VoteDetailsCard';
import * as Base from './VoteDetailsCard.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: VoteDetailsCard,
    decorators: [withViewportFromGlobal, ...Base.default.decorators],
    tags: ['autodocs', 'test'],
    title: 'Features/Vote/VoteDetailsCard@Media',
} satisfies Meta<typeof VoteDetailsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.TowerSync.args;

// The BLS authority is the widest payload — exercises base64-row wrapping at narrow widths.
const blsArgs = Base.AuthorizeCheckedWithBls.args;

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

export const BlsAuthorityMobile: Story = {
    args: blsArgs,
    globals: { viewport: { value: 'iphonex' } },
};

export const BlsAuthorityTabletPortrait: Story = {
    args: blsArgs,
    globals: { viewport: { value: 'ipad' } },
};

export const BlsAuthorityTabletLandscape: Story = {
    args: blsArgs,
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};
