import type { Meta, StoryObj } from '@storybook-config/types';

import { withViewportFromGlobal } from '../../../../../.storybook/responsive-decorators';
import { PmpSecurityTxtTable } from '../PmpSecurityTxtTable';
import * as Base from './PmpSecurityTxtTable.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: PmpSecurityTxtTable,
    decorators: [withViewportFromGlobal],
    parameters: Base.default.parameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Account/security/PmpSecurityTxtTable@Media',
} satisfies Meta<typeof PmpSecurityTxtTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.Primary.args;

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
