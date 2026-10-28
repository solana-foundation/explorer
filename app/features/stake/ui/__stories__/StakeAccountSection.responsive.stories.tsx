import type { Meta, StoryObj } from '@storybook-config/types';

import { withViewportFromGlobal } from '../../../../../.storybook/responsive-decorators';
import { StakeAccountSection } from '../StakeAccountSection';
import * as Base from './StakeAccountSection.stories';

const args = Base.Active.args;

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: StakeAccountSection,
    decorators: [withViewportFromGlobal, ...Base.default.decorators],
    tags: ['autodocs', 'test'],
    title: 'Features/Stake/StakeAccountSection@Media',
} satisfies Meta<typeof StakeAccountSection>;

export default meta;
type Story = StoryObj<typeof meta>;

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
