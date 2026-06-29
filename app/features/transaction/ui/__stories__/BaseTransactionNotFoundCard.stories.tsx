import type { Meta, StoryObj } from '@storybook-config/types';
import { fn } from 'storybook/test';

import { BaseTransactionNotFoundCard } from '../BaseTransactionNotFoundCard';

const meta = {
    args: {
        retry: fn(),
    },
    component: BaseTransactionNotFoundCard,
    tags: ['autodocs', 'test'],
    title: 'Features/Transaction/BaseTransactionNotFoundCard',
} satisfies Meta<typeof BaseTransactionNotFoundCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutRetry: Story = {
    args: {
        retry: undefined,
    },
};

export const WithFirstAvailableBlockNote: Story = {
    args: {
        subtext: 'Note: Transactions processed before block 100 are not available at this time',
    },
};

export const Searching: Story = {
    args: {
        subtext: (
            <span>
                <span className="align-middle">Transaction does not exist</span>
                <br />
                <span
                    style={{ height: '10px', marginRight: '5px', width: '10px' }}
                    className="spinner-grow spinner-grow-sm inline-block align-middle"
                />
                <span className="align-middle text-dk-gray-700">checking devnet</span>
            </span>
        ),
    },
};

export const Found: Story = {
    args: {
        subtext: (
            <span>
                <span className="align-middle">Transaction does not exist</span>
                <br />
                <a href="#" className="align-middle text-dk-info">
                    Found on Devnet
                </a>
            </span>
        ),
    },
};
