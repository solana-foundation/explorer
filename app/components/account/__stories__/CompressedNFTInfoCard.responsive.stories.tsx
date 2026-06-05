import { DEFAULT_BLOCKHASH, gen } from '@__fixtures__/gen';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import type { CompressedNft, CompressedNftProof } from '@/app/providers/compressed-nft';

import { DasCompressionInfoCard } from '../CompressedNFTInfoCard';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const TREE_KEY = TOKEN_PROGRAM_ID;

const sampleProof: CompressedNftProof = {
    leaf: DEFAULT_BLOCKHASH,
    node_index: 0,
    proof: [gen.blockhash(1), gen.blockhash(2), gen.blockhash(3), gen.blockhash(4)],
    root: gen.blockhash(5),
    tree_id: TREE_KEY.toBase58(),
};

const sampleCompressedNft = {
    compression: {
        asset_hash: gen.blockhash(10),
        compressed: true,
        creator_hash: gen.blockhash(11),
        data_hash: gen.blockhash(12),
        eligible: true,
        leaf_id: 42,
        seq: 17,
        tree: TREE_KEY.toBase58(),
    },
} as unknown as CompressedNft;

const meta = {
    component: DasCompressionInfoCard,
    decorators: [withViewportFromGlobal, withClusterAndAccounts, withTokenInfoBatch],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/CompressedNFTInfoCard/Responsive',
} satisfies Meta<typeof DasCompressionInfoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    compressedNft: sampleCompressedNft,
    proof: sampleProof,
};

export const Mobile: Story = {
    args,
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    args,
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    args,
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};
