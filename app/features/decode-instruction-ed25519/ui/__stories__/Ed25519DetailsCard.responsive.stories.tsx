import { instructionDataOf, toInstructionNode } from '@entities/instruction-card';
import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    nextjsParameters,
    withCluster,
    withMockTransactions,
    withScrollAnchor,
    withTokenInfoBatch,
    withTxInstructionSurface,
} from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { invariant } from '@/app/shared/lib/invariant';

import { ed25519InstructionParser } from '../../lib/ed25519-client';
import { Ed25519DetailsCard } from '../Ed25519DetailsCard';

const ix = new TransactionInstruction({
    data: Buffer.from('01000c0001004c0001006e008a000100', 'hex'),
    keys: [],
    programId: new PublicKey('Ed25519SigVerify111111111111111111111111111'),
});

const surroundingIx = new TransactionInstruction({
    data: Buffer.alloc(256),
    keys: [],
    programId: new PublicKey('11111111111111111111111111111111'),
});

const siblingData = instructionDataOf(
    [ix, surroundingIx].map((instruction, index) => toInstructionNode({ index, ix: instruction })),
);

const meta: Meta<typeof Ed25519DetailsCard> = {
    component: Ed25519DetailsCard,
    decorators: [
        withCluster,
        withScrollAnchor,
        withTokenInfoBatch,
        withMockTransactions,
        withTxInstructionSurface,
        withViewportFromGlobal,
    ],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Instruction/Ed25519DetailsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const dispatched = createInstructionParserDispatcher([ed25519InstructionParser]).fromTransactionInstruction(ix);
invariant(dispatched, 'the fixture program id is registered');

const args = {
    ix: dispatched,
    node: { ...toInstructionNode({ index: 0, ix }), raw: ix },
    siblingData,
};

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
