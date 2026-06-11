import { ClusterProvider } from '@providers/cluster';
import { ParsedMessage, ParsedMessageAccount, PublicKey, SystemProgram } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { MockAccountsProvider } from '@storybook-config/__mocks__/MockAccountsProvider';
import { MockTokenInfoBatchProvider } from '@storybook-config/__mocks__/MockTokenInfoBatchProvider';
import { nextjsParameters } from '@storybook-config/decorators';
import { expect, fn, userEvent, within } from 'storybook/test';

import { AccountDetailSlideover } from '../AccountDetailSlideover';

const FEE_PAYER = new PublicKey('9noXzpXnkyEcKF3AeXqUHTdR59V5uvrRBUZ9bwfQwxNq');

const mockAccount: ParsedMessageAccount = {
    pubkey: FEE_PAYER,
    signer: true,
    source: 'transaction',
    writable: true,
};

const mockMessage = {
    accountKeys: [mockAccount],
    addressTableLookups: [],
    instructions: [],
    recentBlockhash: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
} as unknown as ParsedMessage;

const meta: Meta<typeof AccountDetailSlideover> = {
    args: {
        account: mockAccount,
        accountInfoLoading: false,
        index: 0,
        message: mockMessage,
        onOpenChange: fn(),
        open: true,
    },
    component: AccountDetailSlideover,
    decorators: [
        Story => (
            <ClusterProvider>
                <MockTokenInfoBatchProvider>
                    <MockAccountsProvider>
                        <Story />
                    </MockAccountsProvider>
                </MockTokenInfoBatchProvider>
            </ClusterProvider>
        ),
    ],
    parameters: {
        ...nextjsParameters,
        // Render at mobile viewport to match intended use case
        viewport: { defaultViewport: 'mobile1' },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/Transaction/AccountDetailSlideover',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        account: {
            pubkey: new PublicKey(SystemProgram.programId),
            signer: false,
            source: 'transaction',
            writable: false,
        },
        index: 3,
        message: {
            ...mockMessage,
            instructions: [
                { programId: new PublicKey(SystemProgram.programId) } as unknown as ParsedMessage['instructions'][0],
            ],
        },
    },
    play: async () => {
        const body = within(document.body);
        await body.findByRole('dialog');
        expect(body.getByText('Account 4')).toBeInTheDocument();
    },
};
