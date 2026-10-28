import { makeBlock, makeBlockTransaction } from '@entities/block-data/__fixtures__/block-builders';
import { address, lamports } from '@solana/kit';
import { withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BlockAccountsCard } from '../BlockAccountsCard';
import { ACCOUNT_IDS } from './fixtures';

const meta: Meta<typeof BlockAccountsCard> = {
    component: BlockAccountsCard,
    decorators: [withCluster, withTokenInfoBatch],
    tags: ['autodocs', 'test'],
    title: 'Components/Block/BlockAccountsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

// Build the Kit-native block shape consumed by BlockAccountsCard. Account j
// is referenced in every (j+1)-th transaction (descending usage); every 3rd account is writable, so
// the read-write / read-only split varies across rows.
function blockWithTransactions(txCount: number) {
    const keys = ACCOUNT_IDS.map(address);
    return makeBlock(
        Array.from({ length: txCount }, (_, k) => {
            const accountKeyIndexes = ACCOUNT_IDS.map((_, j) => j).filter(j => k % (j + 1) === 0);
            return makeBlockTransaction({
                index: k,
                message: {
                    header: { numReadonlyNonSignerAccounts: 8, numReadonlySignerAccounts: 0, numSignerAccounts: 0 },
                    instructions: [{ accountIndices: accountKeyIndexes, programAddressIndex: 0 }],
                    staticAccounts: keys,
                    version: 'legacy',
                },
                meta: { fee: lamports(5_000n) },
            });
        }),
    );
}

export const WithData: Story = {
    args: {
        block: blockWithTransactions(20),
        blockSlot: 312_456_789,
    },
};

// Empty block — wrapper-only story for visual-regression coverage of the outer card.
export const EmptyBlock: Story = {
    args: {
        block: blockWithTransactions(0),
        blockSlot: 312_456_789,
    },
};
