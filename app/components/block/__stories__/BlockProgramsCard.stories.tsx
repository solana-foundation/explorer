import { PublicKey } from '@solana/web3.js';
import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BlockProgramsCard } from '../BlockProgramsCard';

const meta: Meta<typeof BlockProgramsCard> = {
    component: BlockProgramsCard,
    decorators: [withCluster, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Block/BlockProgramsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

// Program ids used by the synthetic block below (valid base58 — no 0, O, I, l).
const PROGRAM_IDS = [
    'Vote111111111111111111111111111111111111111',
    'ComputeBudget111111111111111111111111111111',
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    '11111111111111111111111111111111',
    'So11111111111111111111111111111111111111112',
];

// Minimal stand-in for a VersionedBlockResponse — just the shape BlockProgramsCard reads. Program j
// appears in every (j+1)-th transaction, giving a descending usage distribution; every 5th tx is
// marked failed (`err`) so Success Rate lands below 100%. All txs carry `meta`, so the Success Rate
// column shows.
function makeBlock(txCount: number) {
    const keys = PROGRAM_IDS.map(id => new PublicKey(id));
    const accountKeys = { get: (i: number) => keys[i], length: keys.length };
    const transactions = Array.from({ length: txCount }, (_, k) => {
        const compiledInstructions = PROGRAM_IDS.map((_, j) => j)
            .filter(j => k % (j + 1) === 0)
            .map(j => ({ programIdIndex: j }));
        return {
            meta: { err: k % 5 === 0 ? { InstructionError: [0, 'Custom'] } : null, innerInstructions: [] },
            transaction: { message: { compiledInstructions, getAccountKeys: () => accountKeys } },
        };
    });
    return { transactions } as any;
}

export const WithData: Story = {
    args: {
        block: makeBlock(12),
    },
};

// Empty block exercises the wrapper without a full BlockWithV1 fixture.
export const EmptyBlock: Story = {
    args: {
        block: { transactions: [] } as any,
    },
};
