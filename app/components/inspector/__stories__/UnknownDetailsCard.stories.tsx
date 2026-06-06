import { ScrollAnchorProvider } from '@providers/scroll-anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { MockAccountsProvider } from '@storybook-config/__mocks__/MockAccountsProvider';
import { MockClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';
import { MockTokenInfoBatchProvider } from '@storybook-config/__mocks__/MockTokenInfoBatchProvider';
import { nextjsParameters } from '@storybook-config/decorators';

import { UnknownDetailsCard } from '../UnknownDetailsCard';

const sampleIx = new TransactionInstruction({
    data: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]),
    keys: [
        { isSigner: true, isWritable: true, pubkey: new PublicKey('11111111111111111111111111111111') },
        { isSigner: false, isWritable: false, pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') },
    ],
    programId: new PublicKey('UnknownProgramx1111111111111111111111111111'),
});

const withProviders: Decorator = Story => (
    <MockClusterProvider>
        <MockAccountsProvider>
            <MockTokenInfoBatchProvider>
                <ScrollAnchorProvider>
                    <Story />
                </ScrollAnchorProvider>
            </MockTokenInfoBatchProvider>
        </MockAccountsProvider>
    </MockClusterProvider>
);

const meta: Meta<typeof UnknownDetailsCard> = {
    component: UnknownDetailsCard,
    decorators: [withProviders],
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
            <div key="inner-1" className="e-rounded-md e-border e-border-solid e-border-dk-gray-700-dark e-p-3">
                Inner instruction 1
            </div>,
            <div key="inner-2" className="e-mt-2 e-rounded-md e-border e-border-solid e-border-dk-gray-700-dark e-p-3">
                Inner instruction 2
            </div>,
        ],
        ix: sampleIx,
        programName: 'Unknown',
    },
};
