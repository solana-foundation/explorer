import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    nextjsParameters,
    withCluster,
    withMockTransactions,
    withScrollAnchor,
    withTokenInfoBatch,
} from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { CodamaInstructionCard } from '../CodamaInstructionDetailsCard';

const sampleIx = new TransactionInstruction({
    data: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]),
    keys: [
        { isSigner: true, isWritable: true, pubkey: new PublicKey('11111111111111111111111111111111') },
        { isSigner: false, isWritable: false, pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') },
    ],
    programId: new PublicKey('CodamaProgramx111111111111111111111111111x1'),
});

// Constructing a fully-formed Codama parseInstruction result requires bundling the program's
// IDL through the Codama runtime, which is heavier than this story warrants. A non-rootNode
// parsedIx routes through the UnknownDetailsCard fallback inside CodamaInstructionCard.
const fallbackParsedIx = { path: [{ kind: 'unknownNode' }] } as any;

const meta: Meta<typeof CodamaInstructionCard> = {
    component: CodamaInstructionCard,
    decorators: [withCluster, withScrollAnchor, withTokenInfoBatch, withMockTransactions],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Instruction/CodamaInstructionDetailsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const UnknownFallback: Story = {
    args: { index: 0, ix: sampleIx, parsedIx: fallbackParsedIx, result: { err: null } },
};
