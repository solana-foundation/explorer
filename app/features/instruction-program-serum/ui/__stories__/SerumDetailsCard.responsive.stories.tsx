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
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { invariant } from '@/app/shared/lib/invariant';

import { serumInstructionParsers } from '../../lib/serum-client';
import { SerumDetailsCard } from '../SerumDetailsCard';

// New Order v3 data from mainnet tx 2fHxffhsx9pJ… (sell, ioc, limit price 50000).
const NEW_ORDER_V3_DATA =
    '000a0000000100000050c30000000000000400000000000000400d03000000000000000000010000000000000000000000ffff';

const raw = makeInstruction({
    data: Buffer.from(NEW_ORDER_V3_DATA, 'hex'),
    keys: Array.from({ length: 12 }, (_, i) => gen.publicKey(i)),
    programId: OPEN_BOOK_PROGRAM_IDS.mainnet,
});

const dispatched = createInstructionParserDispatcher(serumInstructionParsers).fromTransactionInstruction(raw);
invariant(dispatched, 'the OpenBook program id is registered');

const args = { childIndex: undefined, index: 0, innerCards: undefined, ix: dispatched, raw };

const meta: Meta<typeof SerumDetailsCard> = {
    component: SerumDetailsCard,
    decorators: [
        withCluster,
        withScrollAnchor,
        withTokenInfoBatch,
        withMockTransactions,
        withTxInstructionSurface,
        withViewportFromGlobal,
    ],
    tags: ['autodocs', 'test'],
    title: 'Features/InstructionProgramSerum/SerumDetailsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
