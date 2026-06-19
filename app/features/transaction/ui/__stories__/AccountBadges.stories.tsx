import { gen } from '@__fixtures__/gen';
import { ParsedMessage, ParsedMessageAccount, PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';

import { AccountBadges } from '../AccountBadges';

const PUBKEY = new PublicKey(gen.blockhash(1));

const baseAccount: ParsedMessageAccount = {
    pubkey: PUBKEY,
    signer: false,
    source: 'transaction',
    writable: false,
};

const baseMessage = {
    accountKeys: [],
    addressTableLookups: [],
    instructions: [],
    recentBlockhash: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
} as unknown as ParsedMessage;

const meta: Meta<typeof AccountBadges> = {
    args: {
        account: baseAccount,
        index: 1,
        message: baseMessage,
        pubkey: PUBKEY,
    },
    component: AccountBadges,
    tags: ['autodocs', 'test'],
    title: 'Features/Transaction/AccountBadges',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const FeePayer: Story = {
    args: { index: 0 },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Fee Payer')).toBeInTheDocument();
    },
};

export const Signer: Story = {
    args: { account: { ...baseAccount, signer: true } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Signer')).toBeInTheDocument();
    },
};

export const Writable: Story = {
    args: { account: { ...baseAccount, writable: true } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Writable')).toBeInTheDocument();
    },
};

export const Program: Story = {
    args: {
        message: {
            ...baseMessage,
            instructions: [{ programId: PUBKEY } as unknown as ParsedMessage['instructions'][0]],
        },
        pubkey: PUBKEY,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Program')).toBeInTheDocument();
    },
};

export const LookupTable: Story = {
    args: { account: { ...baseAccount, source: 'lookupTable' } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Address Table Lookup')).toBeInTheDocument();
    },
};

export const AllBadges: Story = {
    args: {
        account: { ...baseAccount, signer: true, writable: true },
        index: 0,
        message: {
            ...baseMessage,
            instructions: [{ programId: PUBKEY } as unknown as ParsedMessage['instructions'][0]],
        },
        pubkey: PUBKEY,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Fee Payer')).toBeInTheDocument();
        expect(canvas.getByText('Signer')).toBeInTheDocument();
        expect(canvas.getByText('Writable')).toBeInTheDocument();
        expect(canvas.getByText('Program')).toBeInTheDocument();
    },
};

export const NoBadges: Story = {
    args: { index: 1 },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.queryByText('Fee Payer')).not.toBeInTheDocument();
        expect(canvas.queryByText('Signer')).not.toBeInTheDocument();
    },
};
