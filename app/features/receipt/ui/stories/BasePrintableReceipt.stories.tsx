import type { Meta, StoryObj } from '@storybook/react';

import { BasePrintableReceipt, type LineItem } from '../BasePrintableReceipt';
import {
    defaultReceipt,
    receiptLargeAmount,
    receiptTokenTransfer,
    receiptWithDomains,
    receiptWithMemo,
} from './receipt-fixtures';

const MOCK_SIGNATURE = '5UfDuX7h3bSd5gHSrKaJxYFc7RXvKqTnGjSGZzD3Rt1Xo2gPqAe7rGZtLtKgiXvBbXteu2MngGDPKzJHm6u8RBd';

const EMPTY_LINE_ITEM: LineItem = { description: '', qty: '', total: '', unitPrice: '', vatPercent: '' };
const EMPTY_LINE_ITEMS: LineItem[] = Array.from({ length: 4 }, () => ({ ...EMPTY_LINE_ITEM }));

function forPrintable(data: typeof defaultReceipt) {
    return {
        ...data,
        confirmationStatus: 'finalized' as const,
        signature: MOCK_SIGNATURE,
    };
}

const noop = () => {};

const baseArgs = {
    lineItems: EMPTY_LINE_ITEMS,
    onLineItemChange: noop,
    onSubtotalChange: noop,
    onSupplierAddressChange: noop,
    onSupplierNameChange: noop,
    onVatAmountChange: noop,
    subtotal: '',
    supplierAddress: '',
    supplierName: '',
    vatAmount: '',
};

const meta: Meta<typeof BasePrintableReceipt> = {
    component: BasePrintableReceipt,
    title: 'Features/Receipt/BasePrintableReceipt',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        ...baseArgs,
        data: forPrintable(defaultReceipt),
    },
};

export const WithMemo: Story = {
    args: {
        ...baseArgs,
        data: forPrintable(receiptWithMemo),
    },
};

export const LargeAmount: Story = {
    args: {
        ...baseArgs,
        data: forPrintable(receiptLargeAmount),
    },
};

export const WithDomainNames: Story = {
    args: {
        ...baseArgs,
        data: forPrintable(receiptWithDomains),
    },
};

export const TokenTransfer: Story = {
    args: {
        ...baseArgs,
        data: forPrintable(receiptTokenTransfer),
    },
};

export const WithFilledFields: Story = {
    args: {
        ...baseArgs,
        data: forPrintable(defaultReceipt),
        lineItems: [
            { description: 'Consulting services', qty: '10', total: '1000', unitPrice: '100', vatPercent: '20' },
            { description: 'Software license', qty: '1', total: '500', unitPrice: '500', vatPercent: '20' },
            { ...EMPTY_LINE_ITEM },
            { ...EMPTY_LINE_ITEM },
        ],
        subtotal: '1500',
        supplierAddress: '123 Main St, San Francisco, CA 94105',
        supplierName: 'Acme Corp',
        vatAmount: '300',
    },
};
