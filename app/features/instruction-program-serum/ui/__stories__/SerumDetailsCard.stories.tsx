import { gen } from '@__fixtures__/gen';
import { OPEN_BOOK_PROGRAM_IDS } from '@explorer/decoder-serum';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    nextjsParameters,
    withCluster,
    withMockTransactions,
    withScrollAnchor,
    withTokenInfoBatch,
} from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { SerumDetailsCard } from '../SerumDetailsCard';

// New Order v3 data from mainnet tx 2fHxffhsx9pJ… (sell, ioc, limit price 50000); the card decodes it itself.
const NEW_ORDER_V3_DATA =
    '000a000000010000000050c30000000000000400000000000000400d030000000000000000010000000000000000000000ffff';

function makeNewOrderV3Instruction(): TransactionInstruction {
    return new TransactionInstruction({
        data: Buffer.from(NEW_ORDER_V3_DATA, 'hex'),
        keys: Array.from({ length: 12 }, (_, i) => ({
            isSigner: false,
            isWritable: false,
            pubkey: gen.publicKey(i),
        })),
        programId: new PublicKey(OPEN_BOOK_PROGRAM_IDS.mainnet),
    });
}

const meta: Meta<typeof SerumDetailsCard> = {
    component: SerumDetailsCard,
    decorators: [withCluster, withScrollAnchor, withTokenInfoBatch, withMockTransactions],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/InstructionProgramSerum/SerumDetailsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

// One decoded instruction is representative: the card renders every variant through the same generic field rows.
export const NewOrderV3: Story = {
    args: {
        childIndex: undefined,
        index: 0,
        innerCards: undefined,
        ix: makeNewOrderV3Instruction(),
        result: { err: null },
        signature: gen.signature(0),
    },
};

// Undecodable data falls back to the raw card while the title still resolves from the instruction code.
export const UnknownInstruction: Story = {
    args: {
        ...NewOrderV3.args,
        ix: new TransactionInstruction({
            data: Buffer.from([0, 255, 0, 0, 0]),
            keys: [],
            programId: new PublicKey(OPEN_BOOK_PROGRAM_IDS.mainnet),
        }),
    },
};
