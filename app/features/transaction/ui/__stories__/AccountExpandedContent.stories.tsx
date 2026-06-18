import { PublicKey, SystemProgram } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClusterAccountsAndTokenInfo } from '@storybook-config/decorators';
import { expect, within } from 'storybook/test';

import { AccountExpandedContent } from '../AccountExpandedContent';

const SYSTEM_PROGRAM_ADDRESS = SystemProgram.programId.toBase58();
const UNKNOWN_ADDRESS = new PublicKey('So11111111111111111111111111111111111111112').toBase58();

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
        const skeletons = canvasElement.querySelectorAll('[class*="e-animate-pulse"]');
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

export const WithAccountInfo: Story = {
    args: {
        accountInfo: { data: new Uint8Array(0), size: 1024 },
        address: SYSTEM_PROGRAM_ADDRESS,
        enabled: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Assigned Program Id')).toBeInTheDocument();
        expect(canvas.getByText('1,024 byte(s)')).toBeInTheDocument();
    },
};
