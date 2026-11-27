import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { IdlCard } from '../IdlCard';
import * as Base from './IdlCard.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
// Storybook resolves IDL hooks to no-IDL → empty state with upload instructions.
const meta = {
    component: IdlCard,
    decorators: [withViewportFromGlobal, ...Base.default.decorators],
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/IdlCard@Media',
} satisfies Meta<typeof IdlCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.NoIdl.args;

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
