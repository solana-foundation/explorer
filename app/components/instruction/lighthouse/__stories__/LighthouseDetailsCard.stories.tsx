import { PublicKey } from '@solana/web3.js';
import {
    nextjsParameters,
    withCluster,
    withMockTransactions,
    withScrollAnchor,
    withTokenInfoBatch,
} from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { LighthouseDetailsCard } from '../LighthouseDetailsCard';

// Bytes encode "Assert Sysvar Clock" (logLevel=0, assertion=Slot, value=310832806, op=<).
// Source: existing __tests__/LighthouseDetailsCard.test.tsx fixture.
const assertSysvarClockIx = {
    data: Buffer.from([15, 0, 0, 166, 238, 134, 18, 0, 0, 0, 0, 3]),
    keys: [],
    programId: new PublicKey('L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95'),
};

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
    programId: new PublicKey('L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95'),
};

const meta: Meta<typeof LighthouseDetailsCard> = {
    component: LighthouseDetailsCard,
    decorators: [withCluster, withScrollAnchor, withTokenInfoBatch, withMockTransactions],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Instruction/LighthouseDetailsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AssertSysvarClock: Story = {
    args: { childIndex: undefined, index: 0, innerCards: undefined, ix: assertSysvarClockIx, result: { err: null } },
};

export const AssertAccountInfo: Story = {
    args: { childIndex: undefined, index: 0, innerCards: undefined, ix: assertAccountInfoIx, result: { err: null } },
};
