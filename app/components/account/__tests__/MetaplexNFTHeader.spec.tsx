import type { EditionInfo } from '@entities/nft';
import { some } from '@metaplex-foundation/umi';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
    getCreatorDropdownItems,
    getIsMutablePill,
    MetaplexNFTHeader,
} from '@/app/components/account/MetaplexNFTHeader';
import { makeNftData } from '@/app/entities/nft/lib/__tests__/make-nft-data';

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

describe('MetaplexNFTHeader', () => {
    it('should render NFT name', () => {
        const nftData = makeNftData({ name: 'Cool NFT #42' });
        render(<MetaplexNFTHeader nftData={nftData} />);
        expect(screen.getByText('Cool NFT #42')).toBeDefined();
    });

    it('should show fallback when name is empty', () => {
        const nftData = makeNftData({ name: '' });
        render(<MetaplexNFTHeader nftData={nftData} />);
        expect(screen.getByText('No NFT name was found')).toBeDefined();
    });

    it('should render symbol', () => {
        const nftData = makeNftData({ symbol: 'MYSYM' });
        render(<MetaplexNFTHeader nftData={nftData} />);
        expect(screen.getByText('MYSYM')).toBeDefined();
    });

    it('should show fallback when symbol is empty', () => {
        const nftData = makeNftData({ symbol: '' });
        render(<MetaplexNFTHeader nftData={nftData} />);
        expect(screen.getByText('No Symbol was found')).toBeDefined();
    });

    it('should show Master Edition pill', () => {
        const editionInfo: EditionInfo = {
            edition: undefined,
            masterEdition: { key: 6, maxSupply: some(100n), supply: 0n } as any,
        };
        const nftData = makeNftData({ editionInfo });
        render(<MetaplexNFTHeader nftData={nftData} />);
        expect(screen.getByText('Master Edition')).toBeDefined();
    });

    it('should show Edition X / Y pill', () => {
        const editionInfo: EditionInfo = {
            edition: { edition: 3n, key: 1, parent: '22222222222222222222222222222222' } as any,
            masterEdition: { key: 6, maxSupply: some(100n), supply: 10n } as any,
        };
        const nftData = makeNftData({ editionInfo });
        render(<MetaplexNFTHeader nftData={nftData} />);
        expect(screen.getByText('Edition 3 / 10')).toBeDefined();
    });

    it('should show Primary Market pill when primarySaleHappened is false', () => {
        const nftData = makeNftData();
        render(<MetaplexNFTHeader nftData={nftData} />);
        expect(screen.getByText('Primary Market')).toBeDefined();
    });

    it('should show Mutable pill when isMutable is true', () => {
        const nftData = makeNftData();
        render(<MetaplexNFTHeader nftData={nftData} />);
        expect(screen.getByText('Mutable')).toBeDefined();
    });
});

describe('getCreatorDropdownItems', () => {
    it('should render creator addresses and shares', () => {
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

    it('should show no creators message when list is empty', () => {
        const { container } = render(<div>{getCreatorDropdownItems(null)}</div>);
        expect(container.textContent).toContain('No creators are associated with this NFT.');
    });
});

describe('getIsMutablePill', () => {
    it('should render Mutable', () => {
        const { container } = render(getIsMutablePill(true));
        expect(container.textContent).toContain('Mutable');
    });

    it('should render Immutable', () => {
        const { container } = render(getIsMutablePill(false));
        expect(container.textContent).toContain('Immutable');
    });
});
