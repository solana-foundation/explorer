import { buildTokenTransferCheckedIx } from '@features/receipt/model/__fixtures__/builders';
import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { mockConfirmedSignatureInfo } from '@storybook-config/__fixtures__/account-history';

import { InstructionDetails } from '../InstructionDetails';

const mint = PublicKey.unique();
const innerIx = () =>
    buildTokenTransferCheckedIx({
        amount: '1000000',
        authority: PublicKey.unique(),
        decimals: 6,
        destinationTokenAccount: PublicKey.unique(),
        mint,
        sourceTokenAccount: PublicKey.unique(),
    });

const instructionType = {
    innerInstructions: [innerIx(), innerIx(), innerIx()],
    name: 'Transfer Checked',
};

const meta = {
    component: InstructionDetails,
    tags: ['autodocs', 'test'],
    title: 'Components/Common/InstructionDetails',
} satisfies Meta<typeof InstructionDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
    args: { instructionType, tx: mockConfirmedSignatureInfo() },
};

export const Expanded: Story = {
    args: { defaultExpanded: true, instructionType, tx: mockConfirmedSignatureInfo() },
};
