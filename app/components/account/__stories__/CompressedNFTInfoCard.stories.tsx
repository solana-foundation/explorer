import { PublicKey } from '@solana/web3.js';
import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

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
// proofSize === proof.length. The stories pick the proof length to reach each Proof Size badge.
const meta = {
    component: DasCompressionInfoCard,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    parameters: {
        ...nextjsParameters,
        docs: {
            description: {
                component: [
                    'Compression Info card on the Compression tab of a compressed NFT: the Merkle tree, the current root, the proof size and the leaf hashes.',
                    'The proof badges sit under their values, like the badges in the transaction Accounts table: they wrap onto their own line and the wrapper collapses when there is no badge.',
                    '',
                    '## References',
                    '',
                    '- [OverviewCard](?path=/docs/shared-overviewcard--docs) — the card surface and its "Compression Info" title.',
                    '- [KeyValueRows](?path=/docs/shared-keyvaluerows--docs) — the label/value rows.',
                    '- [Address](?path=/docs/components-common-address--docs) (`raw`, `link` for the tree) — the tree, root and hash values.',
                    '- [Badge](?path=/docs/components-shared-badge--docs) — `Proof Verified` / `Proof Not Verified` under the root, `No Proof Required` / `Composability Hazard` under the proof size.',
                ].join('\n'),
            },
        },
    },
    tags: ['autodocs', 'test'],
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

// An empty proof hashes to the leaf itself, so root === asset_hash verifies, and the zero
// proof size adds the "No Proof Required" badge.
export const ProofVerified: Story = {
    args: {
        compressedNft: sampleCompressedNft,
        proof: {
            ...sampleProof,
            proof: [],
            root: sampleCompressedNft.compression.asset_hash,
        },
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
