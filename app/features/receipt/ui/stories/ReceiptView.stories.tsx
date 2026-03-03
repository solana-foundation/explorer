import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { ReceiptView } from '../ReceiptView';
import {
    defaultReceipt,
    forBaseReceipt,
    receiptTokenTransfer,
    receiptWithDomains,
    receiptWithMemo,
} from './receipt-fixtures';

const meta: Meta<typeof ReceiptView> = {
    args: {
        signature: 'ExampleTransactionSignature',
        transactionPath: 'https://example.com/tx/ExampleTransactionSignature',
    },
    component: ReceiptView,
    title: 'Features/Receipt/ReceiptView',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        data: forBaseReceipt(defaultReceipt),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Solana Receipt')).toBeInTheDocument();
        expect(canvas.getByText('Open transaction in Explorer')).toBeInTheDocument();
        // eslint-disable-next-line no-restricted-syntax -- case-insensitive accessible name match for testing-library query
        expect(canvas.getByRole('button', { name: /share/i })).toBeInTheDocument();
    },
};

export const WithMemo: Story = {
    args: {
        data: forBaseReceipt(receiptWithMemo),
    },
};

export const TokenTransfer: Story = {
    args: {
        data: forBaseReceipt(receiptTokenTransfer, { tokenHref: 'https://example.com/token' }),
    },
};

export const WithDomains: Story = {
    args: {
        data: forBaseReceipt(receiptWithDomains),
    },
};
