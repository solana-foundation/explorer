import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DasCompressionInfoCard } from '@/app/components/account/CompressedNFTInfoCard';
import type { CompressedNft, CompressedNftProof } from '@/app/providers/compressed-nft';

vi.mock('@/app/providers/accounts', async importOriginal => ({
    ...(await importOriginal<typeof import('@/app/providers/accounts')>()),
    useAccountInfo: vi.fn(() => undefined),
    useFetchAccountInfo: vi.fn(() => vi.fn()),
}));

vi.mock('@/app/components/common/Address', () => ({
    Address: ({ pubkey }: { pubkey: PublicKey }) => <span>{pubkey.toBase58()}</span>,
}));

const ASSET_HASH = 'SysvarRent111111111111111111111111111111111';
const TREE = PublicKey.default.toBase58();

describe('DasCompressionInfoCard', () => {
    it('should keep the badges out of the labels when the proof is verified', () => {
        // An empty proof hashes to the leaf itself, so root === asset_hash verifies.
        render(<DasCompressionInfoCard compressedNft={makeCompressedNft()} proof={makeProof([], ASSET_HASH)} />);

        expectPlainLabels();
        expect(screen.getByText('Proof Verified')).toBeInTheDocument();
        expect(screen.getByText('No Proof Required')).toBeInTheDocument();
    });

    it('should keep the badges out of the labels when the proof fails and is too long', () => {
        render(
            <DasCompressionInfoCard
                compressedNft={makeCompressedNft()}
                proof={makeProof(Array.from({ length: 9 }, () => TREE))}
            />,
        );

        expectPlainLabels();
        expect(screen.getByText('Proof Not Verified')).toBeInTheDocument();
        expect(screen.getByText('Composability Hazard')).toBeInTheDocument();
    });

    it('should render no proof size badge for a proof of 1 to 8 nodes', () => {
        render(<DasCompressionInfoCard compressedNft={makeCompressedNft()} proof={makeProof([TREE, TREE])} />);

        expectPlainLabels();
        expect(screen.queryByText('No Proof Required')).not.toBeInTheDocument();
        expect(screen.queryByText('Composability Hazard')).not.toBeInTheDocument();
    });
});

// The label cell's whole text is the label alone, so a badge rendered next to it fails here.
function expectPlainLabels() {
    expect(screen.getByText('Current Tree Root').textContent).toBe('Current Tree Root');
    expect(screen.getByText('Proof Size').textContent).toBe('Proof Size');
}

function makeProof(proof: string[], root = 'So11111111111111111111111111111111111111112'): CompressedNftProof {
    return { leaf: ASSET_HASH, node_index: 0, proof, root, tree_id: TREE };
}

function makeCompressedNft(): CompressedNft {
    return {
        compression: {
            asset_hash: ASSET_HASH,
            compressed: true,
            creator_hash: ASSET_HASH,
            data_hash: ASSET_HASH,
            eligible: true,
            leaf_id: 42,
            seq: 17,
            tree: TREE,
        },
    } as unknown as CompressedNft;
}
