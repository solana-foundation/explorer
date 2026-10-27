import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { ReceiptView } from '../ReceiptView';
import * as Base from './ReceiptView.stories';

const meta: Meta<typeof ReceiptView> = {
    args: Base.default.args,
    component: ReceiptView,
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Features/Receipt/ReceiptView@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.Default.args;

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
