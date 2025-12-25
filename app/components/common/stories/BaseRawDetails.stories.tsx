import { ClusterProvider } from '@providers/cluster';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { expect, within } from 'storybook/test';

import { nextjsParameters } from '../../../../.storybook/decorators';
import { BaseRawDetails } from '../BaseRawDetails';

// Wrapper to render in a table context with required providers
function TableWrapper({ children }: { children: React.ReactNode }) {
    return (
        <ClusterProvider>
            <div className="card">
                <div className="table-responsive mb-0">
                    <table className="table table-sm table-nowrap card-table">
                        <tbody className="list">{children}</tbody>
                    </table>
                </div>
            </div>
        </ClusterProvider>
    );
}

// Create a valid instruction with keys
const createInstructionWithKeys = (): TransactionInstruction => {
    return new TransactionInstruction({
        data: Buffer.from([1, 2, 3, 4]),
        keys: [
            {
                isSigner: true,
                isWritable: true,
                pubkey: new PublicKey('11111111111111111111111111111111'),
            },
            {
                isSigner: false,
                isWritable: true,
                pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            },
            {
                isSigner: false,
                isWritable: false,
                pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'),
            },
        ],
        programId: new PublicKey('11111111111111111111111111111111'),
    });
};

// Create an instruction with no keys (simulates loading state)
const createInstructionWithNoKeys = (): TransactionInstruction => {
    return new TransactionInstruction({
        data: Buffer.from([]),
        keys: [],
        programId: new PublicKey('11111111111111111111111111111111'),
    });
};

const meta = {
    component: BaseRawDetails,
    decorators: [
        Story => (
            <TableWrapper>
                <Story />
            </TableWrapper>
        ),
    ],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/Common/BaseRawDetails',
} satisfies Meta<typeof BaseRawDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoadingState: Story = {
    args: {
        ix: undefined,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Should show loading message
        await expect(canvas.getByText('Loading instruction data...')).toBeInTheDocument();
    },
};

export const LoadingStateWithEmptyKeys: Story = {
    args: {
        ix: createInstructionWithNoKeys(),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Should show loading message when keys array is empty
        await expect(canvas.getByText('Loading instruction data...')).toBeInTheDocument();
    },
};

export const LoadedWithAccounts: Story = {
    args: {
        ix: createInstructionWithKeys(),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Should NOT show loading message
        const loadingMessage = canvas.queryByText('Loading instruction data...');
        await expect(loadingMessage).not.toBeInTheDocument();

        // Should show account rows
        await expect(canvas.getByText('Account #1')).toBeInTheDocument();
        await expect(canvas.getByText('Account #2')).toBeInTheDocument();
        await expect(canvas.getByText('Account #3')).toBeInTheDocument();

        // Should show signer and writable badges
        await expect(canvas.getAllByText('Signer').length).toBeGreaterThan(0);
        await expect(canvas.getAllByText('Writable').length).toBeGreaterThan(0);

        // Should show instruction data row
        await expect(canvas.getByText('Instruction Data')).toBeInTheDocument();
    },
};
