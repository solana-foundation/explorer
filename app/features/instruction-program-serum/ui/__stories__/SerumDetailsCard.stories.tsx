import { gen } from '@__fixtures__/gen';
import { makeInstruction } from '@__fixtures__/instruction';
import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { OPEN_BOOK_PROGRAM_IDS } from '@explorer/decoder-serum';
import {
    withCluster,
    withMockTransactions,
    withScrollAnchor,
    withTokenInfoBatch,
    withTxInstructionSurface,
} from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { invariant } from '@/app/shared/lib/invariant';

import { serumInstructionParsers } from '../../lib/serum-client';
import { SerumDetailsCard } from '../SerumDetailsCard';

// New Order v3 data from mainnet tx 2fHxffhsx9pJ… (sell, ioc, limit price 50000).
const NEW_ORDER_V3_DATA =
    '000a0000000100000050c30000000000000400000000000000400d03000000000000000000010000000000000000000000ffff';

const dispatcher = createInstructionParserDispatcher(serumInstructionParsers);

function storyArgs(data: Buffer, keyCount: number) {
    const keys = Array.from({ length: keyCount }, (_, i) => gen.publicKey(i));
    const raw = makeInstruction({ data, keys, programId: OPEN_BOOK_PROGRAM_IDS.mainnet });
    const ix = dispatcher.fromTransactionInstruction(raw);
    invariant(ix, 'the OpenBook program id is registered');
    return { childIndex: undefined, index: 0, innerCards: undefined, ix, raw };
}

const meta: Meta<typeof SerumDetailsCard> = {
    component: SerumDetailsCard,
    decorators: [withCluster, withScrollAnchor, withTokenInfoBatch, withMockTransactions, withTxInstructionSurface],
    tags: ['autodocs', 'test'],
    title: 'Features/InstructionProgramSerum/SerumDetailsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

// One decoded instruction is representative: the card renders every variant through the same generic field rows.
export const NewOrderV3: Story = {
    args: storyArgs(Buffer.from(NEW_ORDER_V3_DATA, 'hex'), 12),
};

// Undecodable data falls back to the raw card; code 255 is outside the name table, so the title reads "Unknown".
export const UnknownInstruction: Story = {
    args: storyArgs(Buffer.from([0, 255, 0, 0, 0]), 0),
};
