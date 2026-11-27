import { compressedNft, FUNGIBLE_TOKEN } from '@components/account/__fixtures__/compressed-nft';
import { makeAccount } from '@entities/account/__fixtures__/account';
import { TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CompressedNftCard, CompressedNFTHeader, getAssetTypeLabel } from '@/app/components/account/CompressedNftCard';
import type { CompressedNft } from '@/app/providers/compressed-nft';

const useCompressedNft = vi.hoisted(() => vi.fn<() => CompressedNft | null>(() => null));

vi.mock('@/app/providers/cluster', () => ({
    useCluster: vi.fn(() => ({ cluster: 'devnet', url: 'https://api.devnet.solana.com' })),
}));

vi.mock('@/app/providers/accounts', async importOriginal => ({
    ...(await importOriginal<typeof import('@/app/providers/accounts')>()),
    useAccountInfo: vi.fn(() => undefined),
}));

vi.mock('@/app/providers/compressed-nft', () => ({
    useCompressedNft,
    useMetadataJsonLink: vi.fn(() => null),
}));

vi.mock('../UnknownAccountCard', () => ({
    UnknownAccountCard: () => <div data-testid="unknown-account-card" />,
}));

const MINT_ACCOUNT = makeAccount({ data: { raw: Buffer.alloc(82) }, owner: TOKEN_PROGRAM_ID, space: 82 });

const KEY = PublicKey.default.toBase58();

// getAsset resolves fungible mints too, and returns an empty owner for them.
function makeFungibleAsset(assetInterface = FUNGIBLE_TOKEN.assetInterface) {
    return compressedNft({ ...FUNGIBLE_TOKEN, assetInterface });
}

// A non-compressed asset that does have an owner, so the card can still describe it.
function makeCoreAsset() {
    return compressedNft({ assetInterface: 'MplCoreAsset', collection: KEY, compressed: false, owner: KEY });
}

describe('CompressedNftCard', () => {
    it('should fall back to the unknown-account card for an asset with no owner', () => {
        useCompressedNft.mockReturnValue(makeFungibleAsset());

        render(<CompressedNftCard account={MINT_ACCOUNT} />);

        expect(screen.getByTestId('unknown-account-card')).toBeDefined();
    });

    it('should still describe a non-compressed asset that has an owner', () => {
        useCompressedNft.mockReturnValue(makeCoreAsset());

        render(<CompressedNftCard account={MINT_ACCOUNT} />);

        expect(screen.queryByTestId('unknown-account-card')).toBeNull();
        expect(screen.getByText('Owner')).toBeDefined();
        expect(screen.getByText('Update Authority')).toBeDefined();
    });
});

describe('getAssetTypeLabel', () => {
    it('should label a compressed asset as a compressed NFT', () => {
        expect(getAssetTypeLabel(compressedNft({ collection: KEY }))).toBe('Metaplex Compressed NFT');
    });

    it('should label an uncompressed asset from its interface', () => {
        expect(getAssetTypeLabel(makeFungibleAsset())).toBe('Token');
        expect(getAssetTypeLabel(makeFungibleAsset('V1_NFT'))).toBe('Metaplex NFT');
        expect(getAssetTypeLabel(makeFungibleAsset('MplCoreAsset'))).toBe('Metaplex Core Asset');
    });

    it('should fall back to a generic label for an unknown interface', () => {
        expect(getAssetTypeLabel(makeFungibleAsset('SomethingNew'))).toBe('Asset');
    });
});

describe('CompressedNFTHeader', () => {
    it('should keep the art but drop compressed-only labels for an uncompressed asset', () => {
        render(<CompressedNFTHeader compressedNft={makeFungibleAsset()} />);

        expect(screen.getByText('Token')).toBeDefined();
        expect(screen.getByText('dogwifhat')).toBeDefined();
        expect(screen.queryByText('Metaplex Compressed NFT')).toBeNull();
        expect(screen.queryByText('Compressed')).toBeNull();
        expect(screen.queryByText('Verified Collection')).toBeNull();
    });

    it('should keep compressed labels for a real compressed NFT', () => {
        render(<CompressedNFTHeader compressedNft={compressedNft({ collection: KEY })} />);

        expect(screen.getByText('Metaplex Compressed NFT')).toBeDefined();
        expect(screen.getByText('Compressed')).toBeDefined();
        expect(screen.getByText('Verified Collection')).toBeDefined();
    });
});
