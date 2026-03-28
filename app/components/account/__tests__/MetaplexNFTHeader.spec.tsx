import type { EditionInfo } from '@entities/nft';
import { none, some } from '@metaplex-foundation/umi';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { NFTData } from '@/app/providers/accounts';

vi.mock('@providers/cluster', () => ({
    useCluster: vi.fn(() => ({ cluster: 'mainnet-beta', url: 'https://api.mainnet-beta.solana.com' })),
}));

vi.mock('@utils/url', () => ({
    useClusterPath: vi.fn(({ pathname }: { pathname: string }) => pathname),
}));

vi.mock('@providers/accounts', () => ({
    useFetchAccountInfo: vi.fn(() => vi.fn()),
    useMintAccountInfo: vi.fn(() => undefined),
}));

vi.mock('bootstrap/js/dist/dropdown', () => ({
    default: class Dropdown {
        dispose() {}
    },
}));

vi.mock('use-async-effect', () => ({
    default: (_fn: any) => {
        // Don't run async effects in tests
    },
}));

function makeNftData(
    overrides: {
        name?: string;
        symbol?: string;
        editionInfo?: EditionInfo;
        collection?: { key: string; verified: boolean } | null;
        creators?: Array<{ address: string; verified: boolean; share: number }> | null;
    } = {},
): NFTData {
    const {
        name = 'Test NFT',
        symbol = 'TNFT',
        editionInfo = { edition: undefined, masterEdition: undefined },
        collection = null,
        creators = null,
    } = overrides;
    return {
        editionInfo,
        json: { image: 'https://example.com/image.png', name },
        metadata: {
            collection: collection ? some(collection) : none(),
            collectionDetails: none(),
            creators: creators ? some(creators) : none(),
            editionNonce: some(255),
            header: {} as any,
            isMutable: true,
            key: 4,
            mint: '11111111111111111111111111111111' as any,
            name,
            primarySaleHappened: false,
            programmableConfig: none(),
            publicKey: '11111111111111111111111111111111' as any,
            sellerFeeBasisPoints: 500,
            symbol,
            tokenStandard: some(0),
            updateAuthority: '11111111111111111111111111111111' as any,
            uri: 'https://example.com/metadata.json',
            uses: none(),
        } as any,
    };
}

// Dynamic import to avoid hoisting issues with vi.mock
const { MetaplexNFTHeader, getCreatorDropdownItems, getIsMutablePill } = await import(
    '@/app/components/account/MetaplexNFTHeader'
);

describe('MetaplexNFTHeader', () => {
    it('renders NFT name', () => {
        const nftData = makeNftData({ name: 'Cool NFT #42' });
        render(<MetaplexNFTHeader nftData={nftData} address="11111111111111111111111111111111" />);
        expect(screen.getByText('Cool NFT #42')).toBeDefined();
    });

    it('shows fallback when name is empty', () => {
        const nftData = makeNftData({ name: '' });
        render(<MetaplexNFTHeader nftData={nftData} address="11111111111111111111111111111111" />);
        expect(screen.getByText('No NFT name was found')).toBeDefined();
    });

    it('renders symbol', () => {
        const nftData = makeNftData({ symbol: 'MYSYM' });
        render(<MetaplexNFTHeader nftData={nftData} address="11111111111111111111111111111111" />);
        expect(screen.getByText('MYSYM')).toBeDefined();
    });

    it('shows fallback when symbol is empty', () => {
        const nftData = makeNftData({ symbol: '' });
        render(<MetaplexNFTHeader nftData={nftData} address="11111111111111111111111111111111" />);
        expect(screen.getByText('No Symbol was found')).toBeDefined();
    });

    it('shows Master Edition pill', () => {
        const editionInfo: EditionInfo = {
            edition: undefined,
            masterEdition: { key: 6, maxSupply: some(100n), supply: 0n } as any,
        };
        const nftData = makeNftData({ editionInfo });
        render(<MetaplexNFTHeader nftData={nftData} address="11111111111111111111111111111111" />);
        expect(screen.getByText('Master Edition')).toBeDefined();
    });

    it('shows Edition X / Y pill', () => {
        const editionInfo: EditionInfo = {
            edition: { edition: 3n, key: 1, parent: '22222222222222222222222222222222' } as any,
            masterEdition: { key: 6, maxSupply: some(100n), supply: 10n } as any,
        };
        const nftData = makeNftData({ editionInfo });
        render(<MetaplexNFTHeader nftData={nftData} address="11111111111111111111111111111111" />);
        expect(screen.getByText('Edition 3 / 10')).toBeDefined();
    });

    it('shows Primary Market pill when primarySaleHappened is false', () => {
        const nftData = makeNftData();
        render(<MetaplexNFTHeader nftData={nftData} address="11111111111111111111111111111111" />);
        expect(screen.getByText('Primary Market')).toBeDefined();
    });

    it('shows Mutable pill when isMutable is true', () => {
        const nftData = makeNftData();
        render(<MetaplexNFTHeader nftData={nftData} address="11111111111111111111111111111111" />);
        expect(screen.getByText('Mutable')).toBeDefined();
    });
});

describe('getCreatorDropdownItems', () => {
    it('renders creator addresses and shares', () => {
        const creators = [
            { address: 'Creator111111111111111111111111111111111111', share: 80, verified: true },
            { address: 'Creator222222222222222222222222222222222222', share: 20, verified: false },
        ];
        const { container } = render(<div>{getCreatorDropdownItems(creators)}</div>);
        expect(container.textContent).toContain('Creator111111111111111111111111111111111111');
        expect(container.textContent).toContain('80%');
        expect(container.textContent).toContain('Creator222222222222222222222222222222222222');
        expect(container.textContent).toContain('20%');
    });

    it('shows no creators message when list is empty', () => {
        const { container } = render(<div>{getCreatorDropdownItems(null)}</div>);
        expect(container.textContent).toContain('No creators are associated with this NFT.');
    });
});

describe('getIsMutablePill', () => {
    it('renders Mutable', () => {
        const { container } = render(getIsMutablePill(true));
        expect(container.textContent).toContain('Mutable');
    });

    it('renders Immutable', () => {
        const { container } = render(getIsMutablePill(false));
        expect(container.textContent).toContain('Immutable');
    });
});
