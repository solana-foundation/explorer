import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import BN from 'bn.js';
import { expect, within } from 'storybook/test';

import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '../../../../../.storybook/decorators';
import type { SolBalanceChange } from '../../lib/types';
import { SolBalanceChangesCard } from '../SolBalanceChangesCard';

const ALICE = 'GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS';
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const SYSTEM_PROGRAM = '11111111111111111111111111111111';

const meta = {
    component: SolBalanceChangesCard,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Features/Instruction Simulation/UI/SolBalanceChangesCard',
} satisfies Meta<typeof SolBalanceChangesCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Single account with a positive SOL balance change (e.g. received SOL).
 */
export const SinglePositiveChange: Story = {
    args: {
        balanceChanges: [change(ALICE, '1000000000', '2000000000', '3000000000')],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await expect(canvas.getByText('SOL Balance Changes')).toBeInTheDocument();
        await expect(canvas.getByText('1')).toBeInTheDocument();

        // Should show the positive badge
        const badge = canvas.getByText('+', { exact: false });
        await expect(badge).toHaveClass('bg-success-soft');
    },
};

/**
 * Single account with a negative SOL balance change (e.g. sent SOL).
 */
export const SingleNegativeChange: Story = {
    args: {
        balanceChanges: [change(ALICE, '-500000000', '2000000000', '1500000000')],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Should show the negative badge
        const badge = canvas.getByText('-', { exact: false });
        await expect(badge).toHaveClass('bg-warning-soft');
    },
};

/**
 * Multiple accounts with mixed positive and negative balance changes.
 */
export const MultipleChanges: Story = {
    args: {
        balanceChanges: [
            change(ALICE, '-2000000000', '5000000000', '3000000000'),
            change(TOKEN_PROGRAM, '1500000000', '1000000000', '2500000000'),
            change(SYSTEM_PROGRAM, '500000000', '0', '500000000'),
        ],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Should render correct row numbering
        await expect(canvas.getByText('1')).toBeInTheDocument();
        await expect(canvas.getByText('2')).toBeInTheDocument();
        await expect(canvas.getByText('3')).toBeInTheDocument();

        // Should render all table headers
        await expect(canvas.getByText('#')).toBeInTheDocument();
        await expect(canvas.getByText('Address')).toBeInTheDocument();
        await expect(canvas.getByText('Change (SOL)')).toBeInTheDocument();
        await expect(canvas.getByText('Post Balance (SOL)')).toBeInTheDocument();
    },
};

function change(pubkey: string, delta: string, preBalance: string, postBalance: string): SolBalanceChange {
    return {
        delta: new BN(delta),
        postBalance: new BN(postBalance),
        preBalance: new BN(preBalance),
        pubkey: new PublicKey(pubkey),
    };
}
