import type { Meta, StoryObj } from '@storybook-config/types';

import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '../../../../../.storybook/responsive-decorators';
import { PmpSecurityTxtTable } from '../PmpSecurityTxtTable';
import defaultSecurityTxtMock from './mocks/defaultSecurityTxt.json';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: PmpSecurityTxtTable,
    decorators: [withViewportFromGlobal],
    parameters: {
        backgrounds: { default: 'Card' },
        nextjs: { appDirectory: true },
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/security/PmpSecurityTxtTable@Media',
} satisfies Meta<typeof PmpSecurityTxtTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = { data: defaultSecurityTxtMock as any };

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
