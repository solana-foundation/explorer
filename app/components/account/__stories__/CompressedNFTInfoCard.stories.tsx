import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClusterAndAccounts } from '@storybook-config/decorators';

import type { CompressedNft, CompressedNftProof } from '@/app/providers/compressed-nft';

import { DasCompressionInfoCard } from '../CompressedNFTInfoCard';

const TREE_KEY = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

// Hashes are randomly-generated 32-byte pubkey-format strings. MerkleTree.verify
// returns false on these (which is the intent — the badge renders the "Not Verified"
// path) without us needing to construct a real proof.
const sampleProof: CompressedNftProof = {
    leaf: '11111111111111111111111111111111',
    node_index: 0,
    proof: [
        '11111111111111111111111111111111',
        'SysvarRent111111111111111111111111111111111',
        'SysvarC1ock11111111111111111111111111111111',
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    ],
    root: 'So11111111111111111111111111111111111111112',
    tree_id: TREE_KEY.toBase58(),
};

const sampleCompressedNft = {
    compression: {
        asset_hash: '11111111111111111111111111111111',
        compressed: true,
        creator_hash: 'SysvarRent111111111111111111111111111111111',
        data_hash: 'SysvarC1ock11111111111111111111111111111111',
        eligible: true,
        leaf_id: 42,
        seq: 17,
        tree: TREE_KEY.toBase58(),
    },
} as unknown as CompressedNft;

// Tree account isn't seeded in MockAccountsProvider, so canopyDepth resolves to 0 and
// proofSize === proof.length. Adjust the proof length to exercise the "Composability
// Hazard" badge (>8 entries) if desired.
const meta = {
    component: DasCompressionInfoCard,
    decorators: [withClusterAndAccounts],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/Account/CompressedNFTInfoCard',
} satisfies Meta<typeof DasCompressionInfoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        compressedNft: sampleCompressedNft,
        proof: sampleProof,
    },
};

export const LargeProof: Story = {
    args: {
        compressedNft: sampleCompressedNft,
        proof: {
            ...sampleProof,
            proof: Array.from({ length: 10 }, () => '11111111111111111111111111111111'),
        },
    },
};
