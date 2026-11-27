import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { NicknameEditor } from '../NicknameEditor';
import * as Base from './NicknameEditor.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    args: Base.default.args,
    component: NicknameEditor,
    decorators: [...Base.default.decorators, withViewportFromGlobal],
    parameters: Base.default.parameters,
    tags: ['autodocs', 'test'],
    title: 'Features/Nicknames/NicknameEditor@Media',
} satisfies Meta<typeof NicknameEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.LongAddress.args;

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
