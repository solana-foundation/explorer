import { PublicKey } from '@solana/web3.js';
import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BlockAccountsCard } from '../BlockAccountsCard';

const meta: Meta<typeof BlockAccountsCard> = {
    component: BlockAccountsCard,
    decorators: [withCluster, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Block/BlockAccountsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

// Account addresses used by the synthetic block below (valid base58 — no 0, O, I, l). 13 entries so
// the list exceeds the initial 10 rows and the "Load More" control shows.
const ACCOUNT_IDS = [
    '11111111111111111111111111111111',
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
    'So11111111111111111111111111111111111111112',
    'SysvarRent111111111111111111111111111111111',
    'SysvarC1ock11111111111111111111111111111111',
    'Stake11111111111111111111111111111111111111',
    'Vote111111111111111111111111111111111111111',
    'BPFLoaderUpgradeab1e11111111111111111111111',
    'ComputeBudget111111111111111111111111111111',
    'AddressLookupTab1e1111111111111111111111111',
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
];

// Minimal stand-in for a VersionedBlockResponse — just the shape BlockAccountsCard reads. Account j
// is referenced in every (j+1)-th transaction (descending usage); every 3rd account is writable, so
// the read-write / read-only split varies across rows.
function makeBlock(txCount: number) {
    const keys = ACCOUNT_IDS.map(id => new PublicKey(id));
    const accountKeys = { get: (i: number) => keys[i], length: keys.length };
    const transactions = Array.from({ length: txCount }, (_, k) => {
        const accountKeyIndexes = ACCOUNT_IDS.map((_, j) => j).filter(j => k % (j + 1) === 0);
        const message = {
            compiledInstructions: [{ accountKeyIndexes }],
            getAccountKeys: () => accountKeys,
            isAccountWritable: (i: number) => i % 3 === 0,
        };
        return { meta: { loadedAddresses: undefined }, transaction: { message } };
    });
    return { transactions } as any;
}

export const WithData: Story = {
    args: {
        block: makeBlock(20),
        blockSlot: 312_456_789,
    },
};

// Empty block — wrapper-only story for visual-regression coverage of the outer card.
export const EmptyBlock: Story = {
    args: {
        block: { transactions: [] } as any,
        blockSlot: 312_456_789,
    },
};
