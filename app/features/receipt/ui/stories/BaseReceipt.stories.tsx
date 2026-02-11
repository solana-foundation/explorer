import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { BaseReceipt, NoReceipt as NoReceiptComponent } from '../BaseReceipt';
import {
    defaultReceipt,
    forBaseReceipt,
    receiptLargeAmount,
    receiptTokenTransfer,
    receiptWithDomains,
    receiptWithMemo,
} from './receipt-fixtures';

const meta: Meta<typeof BaseReceipt> = {
    argTypes: {
        data: {
            control: 'object',
            description: 'Receipt data with confirmation status',
        },
    },
    component: BaseReceipt,
    title: 'Features/Receipt/BaseReceipt',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        data: forBaseReceipt(defaultReceipt),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const receipt = canvas.getByText('Solana Receipt');
        expect(receipt).toBeInTheDocument();
    },
};

export const WithMemo: Story = {
    args: {
        data: forBaseReceipt(receiptWithMemo),
    },
};

export const LargeAmount: Story = {
    args: {
        data: forBaseReceipt(receiptLargeAmount),
    },
};

export const WithDomainNames: Story = {
    args: {
        data: forBaseReceipt(receiptWithDomains),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('alex.sol')).toBeInTheDocument();
        expect(canvas.getByText('bob.sol')).toBeInTheDocument();
    },
};

export const TokenTransfer: Story = {
    args: {
        data: forBaseReceipt(receiptTokenTransfer, { tokenHref: 'https://example.com/token' }),
    },
};

export const NoReceipt: Story = {
    render: () => <NoReceiptComponent transactionPath="https://example.com/tx/ExampleTransactionSignature" />,
};
