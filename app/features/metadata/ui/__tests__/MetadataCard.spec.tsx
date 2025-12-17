import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import type { Account } from '@/app/providers/accounts';

import {
    getMockAccountWithCompressedNft,
    getMockAccountWithNFTData,
    getMockAccountWithTokenMetadata,
    getMockAccountWithTokenMetadataAndMetaplexMetadata,
} from '../../mocks';
import { MetadataCard } from '../MetadataCard';

vi.mock('@/app/components/common/JsonViewer', () => ({
    SolarizedJsonViewer: ({ src }: { src: any }) => <div data-testid="json-viewer">{JSON.stringify(src, null, 2)}</div>,
}));

vi.mock('../../model/useOffChainMetadata', () => ({
    useOffChainMetadata: vi.fn(() => ({
        metadata: {
            description: 'Cinematic shots of BR1: Operatives getting ready for battle.',
        },
    })),
}));

describe('MetadataCard', () => {
    it('should render Metaplex tab when account has metaplex metadata', () => {
        const { account, getJsonViewer } = setup('metaplexMetadata');
        render(<MetadataCard account={account} />);

        expect(screen.getByText('Metaplex')).toBeInTheDocument();
        expect(getJsonViewer()).toHaveTextContent('USD Coin');
    });

    it('should render token metadata tab when account has token metadata', () => {
        const { account, getJsonViewer } = setup('tokenMetadata');
        render(<MetadataCard account={account} />);
        expect(screen.getByText('Token extension')).toBeInTheDocument();
        expect(getJsonViewer()).toHaveTextContent('PayPal USD');
    });

    it('should render two tabs when account has token metadata and metaplex metadata', () => {
        const { account } = setup('tokenMetadataAndMetaplexMetadata');
        render(<MetadataCard account={account} />);
        expect(screen.getByText('Metaplex')).toBeInTheDocument();
        expect(screen.getByText('Token extension')).toBeInTheDocument();
    });

    it('should render compressed NFT tab when account has compressed NFT', () => {
        const { account, getJsonViewer } = setup('compressedNft');
        render(<MetadataCard account={account} />);
        expect(screen.getByText('Compressed NFT Metadata')).toBeInTheDocument();
        expect(getJsonViewer()).toHaveTextContent('Cinematic shots of BR1: Operatives getting ready for battle');
    });
});

function setup(variant: 'metaplexMetadata' | 'tokenMetadata' | 'compressedNft' | 'tokenMetadataAndMetaplexMetadata'): {
    account: Account;
    getJsonViewer: () => HTMLElement;
} {
    const getJsonViewer = () => screen.getByTestId('json-viewer');

    const account = (() => {
        switch (variant) {
            case 'metaplexMetadata':
                return getMockAccountWithNFTData();
            case 'tokenMetadata':
                return getMockAccountWithTokenMetadata();
            case 'compressedNft':
                return getMockAccountWithCompressedNft();
            case 'tokenMetadataAndMetaplexMetadata':
                return getMockAccountWithTokenMetadataAndMetaplexMetadata();
        }
    })();

    return { account, getJsonViewer };
}
