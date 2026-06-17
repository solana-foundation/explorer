import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import { fn } from 'storybook/test';

import { ReceiptView } from '../ReceiptView';
import { defaultReceipt, forBaseReceipt } from './receipt-fixtures';

const meta: Meta<typeof ReceiptView> = {
    args: {
        downloadCsv: fn().mockResolvedValue(undefined),
        downloadPdf: fn().mockResolvedValue(undefined),
        signature: 'ExampleTransactionSignature',
        transactionPath: 'https://example.com/tx/ExampleTransactionSignature',
    },
    component: ReceiptView,
    decorators: [withViewportFromGlobal],
    parameters: {
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/Receipt/ReceiptView@Media',
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
