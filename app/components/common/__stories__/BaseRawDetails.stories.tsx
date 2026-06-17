import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { MockClusterProvider as ClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';
import { nextjsParameters, withTokenInfoBatch } from '@storybook-config/decorators';
import React from 'react';
import { expect, within } from 'storybook/test';

import { BaseTable } from '@/app/shared/ui/Table';

import { BaseRawDetails } from '../BaseRawDetails';

// Wrapper to render in a table context with required providers
function TableWrapper({ children }: { children: React.ReactNode }) {
    return (
        <ClusterProvider>
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Body>{children}</BaseTable.Body>
            </BaseTable>
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
                pubkey: PublicKey.default,
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
        programId: PublicKey.default,
    });
};

// Instruction with no accounts and no data (legal in Solana — e.g. a no-op-style call).
// Inspector hits this shape via URL params with hand-crafted messages.
const createInstructionWithNoKeys = (): TransactionInstruction => {
    return new TransactionInstruction({
        data: Buffer.from([]),
        keys: [],
        programId: PublicKey.default,
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
        withTokenInfoBatch,
    ],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
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

        // Loader (spinner + label) renders only when ix has not arrived yet
        await expect(canvas.getByText('Loading instruction data...')).toBeInTheDocument();
        await expect(canvasElement.querySelector('.spinner-grow')).toBeInTheDocument();

        // No account/data rows leak through while loading
        await expect(canvas.queryByText('Account #1')).not.toBeInTheDocument();
        await expect(canvas.queryByText('Instruction Data')).not.toBeInTheDocument();
    },
};

export const EmptyAccountsList: Story = {
    args: {
        ix: createInstructionWithNoKeys(),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Empty keys is a valid instruction shape, not a loading state
        await expect(canvas.queryByText('Loading instruction data...')).not.toBeInTheDocument();
        await expect(canvas.queryByText('Account #1')).not.toBeInTheDocument();

        // Data row always renders; empty data falls through to HexData's "No data"
        await expect(canvas.getByText('Instruction Data')).toBeInTheDocument();
        await expect(canvas.getByText('No data')).toBeInTheDocument();
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
