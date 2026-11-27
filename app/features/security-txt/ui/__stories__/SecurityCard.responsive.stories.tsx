import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { SecurityCard } from '../SecurityCard';
import * as Base from './SecurityCard.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: SecurityCard,
    decorators: [withViewportFromGlobal, ...Base.default.decorators],
    tags: ['autodocs', 'test'],
    title: 'Features/SecurityTxt/SecurityCard@Media',
} satisfies Meta<typeof SecurityCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.WithEmbeddedSecurityTxt.args;

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
