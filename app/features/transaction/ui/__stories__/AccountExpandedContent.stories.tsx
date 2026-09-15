/* eslint-disable no-restricted-syntax -- storybook play functions use RegExp for pattern matching */
import { PublicKey, SystemProgram } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MockAccountsProvider } from '@storybook-config/__mocks__/MockAccountsProvider';
import { nextjsParameters, withClusterAccountsAndTokenInfo } from '@storybook-config/decorators';
import React from 'react';
import { expect, within } from 'storybook/test';

import { FetchStatus } from '@/app/providers/cache';
import { ClusterProvider } from '@/app/providers/cluster';

import { AccountExpandedContent } from '../AccountExpandedContent';

const SYSTEM_PROGRAM_ADDRESS = SystemProgram.programId.toBase58();
const UNKNOWN_ADDRESS = new PublicKey('So11111111111111111111111111111111111111112').toBase58();
const SIZED_ADDRESS = new PublicKey('Sysvar1nstructions1111111111111111111111111').toBase58();

const meta: Meta<typeof AccountExpandedContent> = {
    args: {
        address: SYSTEM_PROGRAM_ADDRESS,
        enabled: true,
    },
    component: AccountExpandedContent,
    decorators: [withClusterAccountsAndTokenInfo],
    parameters: {
        ...nextjsParameters,
    },
    tags: ['autodocs', 'test'],
    title: 'Features/Transaction/AccountExpandedContent',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
    args: {
        address: SYSTEM_PROGRAM_ADDRESS,
        enabled: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Assigned Program Id')).toBeInTheDocument();
        expect(canvas.getByText('Executable')).toBeInTheDocument();
        expect(canvas.getByText('Balance')).toBeInTheDocument();
    },
};

export const Loading: Story = {
    args: {
        address: UNKNOWN_ADDRESS,
        enabled: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Shows skeleton loaders while fetching
        const skeletons = canvasElement.querySelectorAll('[class*="animate-pulse"]');
        // No account data labels while loading
        expect(canvas.queryByText('Assigned Program Id')).not.toBeInTheDocument();
        expect(skeletons.length).toBeGreaterThan(0);
    },
};

export const Disabled: Story = {
    args: {
        address: SYSTEM_PROGRAM_ADDRESS,
        enabled: false,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.queryByText('Assigned Program Id')).not.toBeInTheDocument();
    },
};

export const FlatLayout: Story = {
    args: {
        address: SYSTEM_PROGRAM_ADDRESS,
        enabled: true,
        flat: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Assigned Program Id')).toBeInTheDocument();
    },
};

// The size is read from the account itself, so the story seeds one rather than passing a prop.
export const WithAccountSize: Story = {
    args: {
        address: SIZED_ADDRESS,
        enabled: true,
    },
    decorators: [
        Story => (
            <ClusterProvider>
                <MockAccountsProvider
                    accounts={{
                        [SIZED_ADDRESS]: {
                            data: {
                                data: {},
                                executable: false,
                                lamports: 1_000_000_000,
                                owner: SystemProgram.programId,
                                pubkey: new PublicKey(SIZED_ADDRESS),
                                space: 1024,
                            },
                            status: FetchStatus.Fetched,
                        },
                    }}
                >
                    <Story />
                </MockAccountsProvider>
            </ClusterProvider>
        ),
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Assigned Program Id')).toBeInTheDocument();
        expect(canvas.getByText('1,024 byte(s)')).toBeInTheDocument();
    },
};

// An account with no data has nothing to view, so the count renders as plain text.
export const EmptyAccount: Story = {
    args: {
        address: SIZED_ADDRESS,
        enabled: true,
    },
    decorators: [
        Story => (
            <ClusterProvider>
                <MockAccountsProvider
                    accounts={{
                        [SIZED_ADDRESS]: {
                            data: {
                                data: {},
                                executable: false,
                                lamports: 1_000_000_000,
                                owner: SystemProgram.programId,
                                pubkey: new PublicKey(SIZED_ADDRESS),
                                space: 0,
                            },
                            status: FetchStatus.Fetched,
                        },
                    }}
                >
                    <Story />
                </MockAccountsProvider>
            </ClusterProvider>
        ),
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('0 byte(s)')).toBeInTheDocument();
        expect(canvas.queryByRole('button', { name: /byte\(s\)/ })).not.toBeInTheDocument();
    },
};
