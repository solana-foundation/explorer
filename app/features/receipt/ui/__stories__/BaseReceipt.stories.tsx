import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import type { TransferRow } from '../../types';
import { BaseReceipt, NoReceipt as NoReceiptComponent } from '../BaseReceipt';
import {
    defaultReceipt,
    forBaseReceipt,
    innerInstructionsNoReceiptMessage,
    mixedMintNoReceiptMessage,
    receiptLargeAmount,
    receiptMultiTokenTransfer,
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
    tags: ['autodocs', 'test'],
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

const multiTransferRows: TransferRow[] = Array.from({ length: 7 }, (_, i) => ({
    amount: { formatted: '0.00203928', raw: 203928, unit: 'SOL' },
    receiver: {
        address: '3mMgoF7M6k2xYkNmS4mQv6m4RqB9QeW1jH5AaEpPxYr',
        truncated: '3mMg...oF7M',
    },
    receiverHref: `https://example.com/receiver-${i}`,
    sender: {
        address: 'J8HaB2kNmS4mQv6m4RqB9QeW1jH5AaEpPxYrEpPx',
        truncated: 'J8Ha...EpPx',
    },
    senderHref: `https://example.com/sender-${i}`,
}));

export const MultiTransfer: Story = {
    args: {
        data: forBaseReceipt(receiptWithMemo, { transfers: multiTransferRows }),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Solana Receipt')).toBeInTheDocument();
        expect(canvas.getAllByText('J8Ha...EpPx')).toHaveLength(7);
    },
};

export const MultiTokenTransfer: Story = {
    args: {
        data: forBaseReceipt(receiptMultiTokenTransfer, { tokenHref: 'https://example.com/token' }),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Solana Receipt')).toBeInTheDocument();
        expect(canvas.getAllByText('USDC')).toHaveLength(2);
    },
};

export const NoReceipt: Story = {
    render: () => <NoReceiptComponent transactionPath="https://example.com/tx/ExampleTransactionSignature" />,
};

export const NoReceiptMixedMint: Story = {
    render: () => (
        <NoReceiptComponent
            transactionPath="https://example.com/tx/ExampleTransactionSignature"
            message={mixedMintNoReceiptMessage}
        />
    ),
};

export const NoReceiptInnerInstructions: Story = {
    render: () => (
        <NoReceiptComponent
            transactionPath="https://example.com/tx/ExampleTransactionSignature"
            message={innerInstructionsNoReceiptMessage}
        />
    ),
};
