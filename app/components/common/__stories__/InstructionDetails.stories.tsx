import { gen } from '@__fixtures__/gen';
import { buildTokenTransferCheckedIx } from '@features/receipt/model/__fixtures__/builders';
import type { Meta, StoryObj } from '@storybook/react';
import { mockConfirmedSignatureInfo } from '@storybook-config/__fixtures__/account-history';

import { InstructionDetails } from '../InstructionDetails';

const mint = gen.publicKey(0);
const innerIx = (i: number) =>
    buildTokenTransferCheckedIx({
        amount: '1000000',
        authority: gen.publicKey(i * 3 + 1),
        decimals: 6,
        destinationTokenAccount: gen.publicKey(i * 3 + 2),
        mint,
        sourceTokenAccount: gen.publicKey(i * 3 + 3),
    });

const instructionType = {
    innerInstructions: [innerIx(0), innerIx(1), innerIx(2)],
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
