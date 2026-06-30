import { toParsedInstruction } from '@entities/instruction-parser';
import { PublicKey, type TransactionInstruction } from '@solana/web3.js';
import {
    nextjsParameters,
    withCluster,
    withMockTransactions,
    withScrollAnchor,
    withTokenInfoBatch,
} from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import { LIGHTHOUSE_ADDRESS, LIGHTHOUSE_PROGRAM_LABEL } from '../../lib/constants';
import { parseLighthouseInstruction } from '../../lib/lighthouse-parser';
import { LighthouseDetailsCard } from '../LighthouseDetailsCard';

// Build the card's props the same way the unified dispatcher does: decode the
// raw instruction into the canonical `{ type, info }` shape, then wrap it as a
// ParsedInstruction. `raw` carries the full account list for the table.
function buildArgs(raw: TransactionInstruction) {
    const parsed = parseLighthouseInstruction(toKitInstruction(raw));
    if (!parsed) throw new Error('fixture failed to parse as a Lighthouse instruction');
    return {
        childIndex: undefined,
        index: 0,
        innerCards: undefined,
        ix: toParsedInstruction(parsed, LIGHTHOUSE_PROGRAM_LABEL, raw.programId),
        raw,
        result: { err: null },
    };
}

// Bytes encode "Assert Sysvar Clock" (logLevel=0, assertion=Slot, value=310832806, op=<).
const assertSysvarClockIx = {
    data: Buffer.from([15, 0, 0, 166, 238, 134, 18, 0, 0, 0, 0, 3]),
    keys: [],
    programId: new PublicKey(LIGHTHOUSE_ADDRESS),
} as unknown as TransactionInstruction;

// Assert Account Info — single Target Account.
const assertAccountInfoIx = {
    data: Buffer.from([5, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    keys: [
        {
            isSigner: false,
            isWritable: false,
            pubkey: new PublicKey('AUuYypaXez7kXWWWYecmsb89prMCnba6g2tBWm3BxKQV'),
        },
    ],
    programId: new PublicKey(LIGHTHOUSE_ADDRESS),
} as unknown as TransactionInstruction;

const meta: Meta<typeof LighthouseDetailsCard> = {
    component: LighthouseDetailsCard,
    decorators: [withCluster, withScrollAnchor, withTokenInfoBatch, withMockTransactions],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Instruction/LighthouseDetailsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AssertSysvarClock: Story = { args: buildArgs(assertSysvarClockIx) };

export const AssertAccountInfo: Story = { args: buildArgs(assertAccountInfoIx) };
