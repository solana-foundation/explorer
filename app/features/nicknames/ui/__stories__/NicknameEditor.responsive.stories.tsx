import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import type { Meta, StoryObj } from '@storybook/react';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import { fn } from 'storybook/test';

import { NicknameEditor } from '../NicknameEditor';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
// layout: 'fullscreen' removes Storybook's default canvas padding so the editor's `position: fixed` overlay anchors to the iframe viewport directly.
const meta = {
    component: NicknameEditor,
    decorators: [withViewportFromGlobal],
    parameters: {
        layout: 'fullscreen',
        nextjs: { appDirectory: true },
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/Nicknames/NicknameEditor/Responsive',
} satisfies Meta<typeof NicknameEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    address: TOKEN_PROGRAM_ID.toBase58(),
    onClose: fn(),
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
