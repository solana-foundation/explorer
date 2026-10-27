import { gen } from '@__fixtures__/gen';
import { toRawInstructionNode } from '@entities/instruction-card';
import { withMockTransactions, withTokenInfoBatch, withTxInstructionSurface } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { ammV3Instruction, ammV3Program, UPDATE_REWARD_INFOS_DISCRIMINATOR } from '../../__fixtures__/anchor-programs';
import { decodeAnchorInstruction } from '../../lib/decode-anchor-instruction';
import { AnchorDetailsCard } from '../AnchorDetailsCard';

const meta = {
    component: AnchorDetailsCard,
    decorators: [withTxInstructionSurface, withMockTransactions, withTokenInfoBatch],
    tags: ['autodocs', 'test'],
    // TODO(decode-instruction-with-idl): rename to a feature-scoped title once the Storybook tree migration off
    // the Dashkit layout lands; kept stable here to avoid churning the tree mid-move.
    title: 'Components/Instruction/AnchorDetailsCard',
} satisfies Meta<typeof AnchorDetailsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const updateRewardInfosIx = ammV3Instruction(UPDATE_REWARD_INFOS_DISCRIMINATOR);
export const UpdateRewardInfos: Story = {
    args: {
        decoded: decodeAnchorInstruction(ammV3Program, updateRewardInfosIx),
        node: toRawInstructionNode({ index: 0, ix: updateRewardInfosIx }),
        program: ammV3Program,
    },
};

// Synthetic data matches no known discriminator, so the card renders the "Failed to decode" row.
const failedToDecodeIx = ammV3Instruction([0, 0, 0, 0, 0, 0, 0, 0], gen.publicKey(2));
export const FailedToDecode: Story = {
    args: {
        decoded: decodeAnchorInstruction(ammV3Program, failedToDecodeIx),
        node: toRawInstructionNode({ index: 1, ix: failedToDecodeIx }),
        program: ammV3Program,
    },
};
