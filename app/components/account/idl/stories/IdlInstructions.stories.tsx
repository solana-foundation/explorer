import type { Meta, StoryObj } from '@storybook/react';

import { IdlInstructionsView } from '../formatted-idl/IdlInstructions';

const meta = {
    component: IdlInstructionsView,
    decorators: [
        Story => (
            <div>
                <Story />
            </div>
        ),
    ],
    parameters: {
        nextjs: {
            appDirectory: true,
        },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/idl/components/IdlInstructions',
} satisfies Meta<typeof IdlInstructionsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SimpleInstructions: Story = {
    args: {
        data: [
            {
                accounts: [
                    { docs: ['Account that can update the data'], name: 'authority', signer: true, writable: false },
                    { docs: ['Account to initialize'], name: 'newAccount', signer: false, writable: true },
                ],
                args: [{ docs: ['Initial value'], name: 'data', type: 'u64' }],
                docs: ['Initialize a new account'],
                name: 'initialize',
            },
            {
                accounts: [
                    { docs: ['Account that can update the data'], name: 'authority', signer: true, writable: false },
                    { docs: ['Account to update'], name: 'account', signer: false, writable: true },
                ],
                args: [{ docs: ['New value to store'], name: 'newValue', type: 'u64' }],
                docs: ['Update the stored value'],
                name: 'updateValue',
            },
        ],
    },
};

export const NestedAccounts: Story = {
    args: {
        data: [
            {
                accounts: [
                    {
                        accounts: [
                            { docs: ['Admin account'], name: 'admin', signer: true, writable: false },
                            {
                                docs: ['New marketplace account'],
                                name: 'marketplaceAccount',
                                signer: false,
                                writable: true,
                            },
                            { docs: ['Treasury account'], name: 'treasuryAccount', signer: false, writable: true },
                            { docs: ['System program'], name: 'systemProgram', signer: false, writable: false },
                        ],
                        name: 'Context',
                    },
                    { docs: ['Mint authority'], name: 'mintAuthority', optional: true, signer: true, writable: true },
                    { docs: ['Token program'], name: 'tokenProgram', signer: false, writable: false },
                ],
                args: [
                    { docs: ['Fee percentage in basis points'], name: 'feePercentage', type: 'u16' },
                    { docs: ['Marketplace name'], name: 'name', type: 'string' },
                ],
                docs: ['Create a new marketplace'],
                name: 'createMarketplace',
            },
        ],
    },
};

export const WithOptionalAndPdaAccounts: Story = {
    args: {
        data: [
            {
                accounts: [
                    { docs: ['Seller account'], name: 'seller', signer: true, writable: false },
                    { docs: ['NFT token account'], name: 'nftAccount', signer: false, writable: true },
                    { docs: ['NFT mint'], name: 'nftMint', signer: false, writable: false },
                    { docs: ['Listing account'], name: 'listingAccount', pda: true, signer: false, writable: true },
                    {
                        docs: ['Metadata account (optional)'],
                        name: 'metadataAccount',
                        optional: true,
                        signer: false,
                        writable: false,
                    },
                    {
                        docs: ['Collection account (optional)'],
                        name: 'collectionAccount',
                        optional: true,
                        signer: false,
                        writable: false,
                    },
                ],
                args: [
                    { docs: ['Listing price'], name: 'price', type: 'u64' },
                    { docs: ['Listing duration in seconds'], name: 'duration', type: 'u64' },
                ],
                docs: ['Create a new listing in the marketplace'],
                name: 'createListing',
            },
        ],
    },
};

export const NoArguments: Story = {
    args: {
        data: [
            {
                accounts: [
                    { docs: ['Account authority'], name: 'authority', signer: true, writable: false },
                    { docs: ['Account to close'], name: 'account', signer: false, writable: true },
                    { docs: ['Destination for reclaimed rent'], name: 'destination', signer: false, writable: true },
                ],
                args: [],
                docs: ['Close an account and reclaim rent'],
                name: 'closeAccount',
            },
        ],
    },
};

export const NoInstructions: Story = {
    args: {
        data: [],
    },
};
