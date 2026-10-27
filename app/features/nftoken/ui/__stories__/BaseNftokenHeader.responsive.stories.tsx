import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseNftokenHeader } from '../BaseNftokenHeader';
import * as Base from './BaseNftokenHeader.stories';

const meta = {
    component: BaseNftokenHeader,
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Features/NFToken/NftokenHeader@Media',
} satisfies Meta<typeof BaseNftokenHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.NftMutable.args;

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
