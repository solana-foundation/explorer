import { makeBlock, makeBlockTransaction } from '@entities/block-data/__fixtures__/block-builders';
import { address, lamports } from '@solana/kit';
import { withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BlockProgramsCard } from '../BlockProgramsCard';

const meta: Meta<typeof BlockProgramsCard> = {
    component: BlockProgramsCard,
    decorators: [withCluster, withTokenInfoBatch],
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

// Build the Kit-native block shape consumed by BlockProgramsCard. Program j
// appears in every (j+1)-th transaction, giving a descending usage distribution; every 5th tx is
// marked failed (`err`) so Success Rate lands below 100%. All txs carry `meta`, so the Success Rate
// column shows.
function blockWithTransactions(txCount: number) {
    const keys = PROGRAM_IDS.map(address);
    return makeBlock(
        Array.from({ length: txCount }, (_, k) => {
            const instructions = PROGRAM_IDS.map((_, j) => j)
                .filter(j => k % (j + 1) === 0)
                .map(j => ({ programAddressIndex: j }));
            return makeBlockTransaction({
                index: k,
                message: {
                    header: {
                        numReadonlyNonSignerAccounts: keys.length,
                        numReadonlySignerAccounts: 0,
                        numSignerAccounts: 0,
                    },
                    instructions,
                    staticAccounts: keys,
                    version: 'legacy',
                },
                meta: {
                    err: k % 5 === 0 ? { InstructionError: [0, { Custom: 1 }] } : null,
                    fee: lamports(5_000n),
                    innerInstructions: [],
                },
            });
        }),
    );
}

export const WithData: Story = {
    args: {
        block: blockWithTransactions(12),
    },
};

export const EmptyBlock: Story = {
    args: {
        block: blockWithTransactions(0),
    },
};
