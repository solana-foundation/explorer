import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { BaseReceiptImage, IMAGE_SIZE } from '../BaseReceiptImage';
import {
    defaultReceipt,
    receiptLargeAmountWithMemo,
    receiptTokenTransferSimple,
    receiptWithMemo,
} from './receipt-fixtures';

const meta: Meta<typeof BaseReceiptImage> = {
    argTypes: {
        data: {
            control: 'object',
            description: 'Receipt data',
        },
        options: {
            control: 'object',
            description: 'Receipt options',
        },
    },
    component: BaseReceiptImage,
    decorators: [
        Story => (
            <div style={{ height: IMAGE_SIZE.height, width: IMAGE_SIZE.width }}>
                <Story />
            </div>
        ),
    ],
    title: 'Features/Receipt/BaseReceiptImage',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        data: defaultReceipt,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const receipt = canvas.getByText('Receipt');
        expect(receipt).toBeInTheDocument();
    },
};

export const LargeAmount: Story = {
    args: {
        data: receiptLargeAmountWithMemo,
    },
};

export const LongMemo: Story = {
    args: {
        data: receiptWithMemo,
    },
};

export const TokenTransfer: Story = {
    args: {
        data: receiptTokenTransferSimple,
    },
};

export const NoReceipt: Story = {
    args: {
        data: undefined,
    },
};
