import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
    nextjsParameters,
    withClusterAndAccounts,
    withScrollAnchor,
    withTokenInfoBatch,
} from '@storybook-config/decorators';

import { UnknownDetailsCard } from '../UnknownDetailsCard';

const sampleIx = new TransactionInstruction({
    data: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]),
    keys: [
        { isSigner: true, isWritable: true, pubkey: new PublicKey('11111111111111111111111111111111') },
        { isSigner: false, isWritable: false, pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') },
    ],
    programId: new PublicKey('UnknownProgramx1111111111111111111111111111'),
});

const meta: Meta<typeof UnknownDetailsCard> = {
    component: UnknownDetailsCard,
    // First decorator is innermost — same nesting as the previous local withProviders.
    decorators: [withScrollAnchor, withTokenInfoBatch, withClusterAndAccounts],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Inspector/UnknownDetailsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        index: 0,
        ix: sampleIx,
        programName: 'Unknown',
    },
};

export const WithInnerCards: Story = {
    args: {
        index: 1,
        // innerCards renders inside a <div> wrapper, so each entry should be a block-level
        // element (typically a nested InstructionCard in real usage).
        innerCards: [
            <div key="inner-1" className="rounded-md border border-solid border-dk-gray-700-dark p-3">
                Inner instruction 1
            </div>,
            <div key="inner-2" className="mt-2 rounded-md border border-solid border-dk-gray-700-dark p-3">
                Inner instruction 2
            </div>,
        ],
        ix: sampleIx,
        programName: 'Unknown',
    },
};
