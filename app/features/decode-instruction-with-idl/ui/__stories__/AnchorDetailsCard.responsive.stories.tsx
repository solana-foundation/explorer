import { toInstructionNode } from '@entities/instruction-card';
import { withMockTransactions, withTokenInfoBatch, withTxInstructionSurface } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { ammV3Instruction, ammV3Program, UPDATE_REWARD_INFOS_DISCRIMINATOR } from '../../__fixtures__/anchor-programs';
import { decodeAnchorInstruction } from '../../lib/decode-anchor-instruction';
import { AnchorDetailsCard } from '../AnchorDetailsCard';

const ix = ammV3Instruction(UPDATE_REWARD_INFOS_DISCRIMINATOR);

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: AnchorDetailsCard,
    decorators: [withMockTransactions, withTokenInfoBatch, withTxInstructionSurface, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    // TODO(decode-instruction-with-idl): rename to a feature-scoped title once the Storybook tree migration off
    // the Dashkit layout lands; kept stable here to avoid churning the tree mid-move.
    title: 'Components/Instruction/AnchorDetailsCard@Media',
} satisfies Meta<typeof AnchorDetailsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    decoded: decodeAnchorInstruction(ammV3Program, ix),
    ix,
    node: toInstructionNode({ index: 0, ix }),
    program: ammV3Program,
};

export const Mobile: Story = {
    args,
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    args,
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    args,
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};
