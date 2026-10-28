import { defaultReceipt, forBaseReceipt } from '@features/receipt/__fixtures__/receipts';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseReceipt } from '../BaseReceipt';

const meta: Meta<typeof BaseReceipt> = {
    component: BaseReceipt,
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Features/Receipt/BaseReceipt@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { data: forBaseReceipt(defaultReceipt) };

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
