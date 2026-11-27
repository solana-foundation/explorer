/* eslint-disable no-restricted-syntax -- storybook play functions use RegExp for pattern matching */
import { gen } from '@__fixtures__/gen';
import { makeAccount } from '@entities/account/__fixtures__/account';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { withAccountsState, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import { expect, within } from 'storybook/test';

import { FetchStatus } from '@/app/providers/cache';
import { MAINNET_BETA_URL } from '@/app/utils/cluster';

import { AccountExpandedContent } from '../AccountExpandedContent';

const SYSTEM_PROGRAM_ADDRESS = SystemProgram.programId.toBase58();
const UNKNOWN_ADDRESS = new PublicKey('So11111111111111111111111111111111111111112').toBase58();
const SIZED_ADDRESS = gen.address(1);

const meta: Meta<typeof AccountExpandedContent> = {
    args: {
        address: SYSTEM_PROGRAM_ADDRESS,
        enabled: true,
    },
    component: AccountExpandedContent,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
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

export const WithAccountSize: Story = {
    args: {
        address: SIZED_ADDRESS,
        enabled: true,
    },
    decorators: [
        withAccountsState({
            entries: {
                [SIZED_ADDRESS]: {
                    data: makeAccount({ pubkey: new PublicKey(SIZED_ADDRESS), space: 1024 }),
                    status: FetchStatus.Fetched,
                },
            },
            url: MAINNET_BETA_URL,
        }),
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Assigned Program Id')).toBeInTheDocument();
        expect(canvas.getByText('1,024 byte(s)')).toBeInTheDocument();
    },
};

export const EmptyAccount: Story = {
    args: {
        address: SIZED_ADDRESS,
        enabled: true,
    },
    decorators: [
        withAccountsState({
            entries: {
                [SIZED_ADDRESS]: {
                    data: makeAccount({ pubkey: new PublicKey(SIZED_ADDRESS), space: 0 }),
                    status: FetchStatus.Fetched,
                },
            },
            url: MAINNET_BETA_URL,
        }),
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('0 byte(s)')).toBeInTheDocument();
        expect(canvas.queryByRole('button', { name: /byte\(s\)/ })).not.toBeInTheDocument();
    },
};
