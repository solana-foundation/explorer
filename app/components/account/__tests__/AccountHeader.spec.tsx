import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { AccountHeader } from '@/app/components/account/AccountHeader';
import { useSecurityTxt } from '@/app/features/security-txt';
import { createNeodymeSecurityTxt, createPmpSecurityTxt } from '@/app/features/security-txt/ui/__tests__/helpers';
import type { Account, UpgradeableLoaderAccountData } from '@/app/providers/accounts';

vi.mock('@/app/providers/cluster', () => ({
    useCluster: vi.fn(() => ({
        cluster: 'mainnet-beta',
        url: 'https://api.mainnet-beta.solana.com',
    })),
}));

vi.mock('@/app/features/security-txt', async () => ({
    ...(await vi.importActual('@/app/features/security-txt')),
    useSecurityTxt: vi.fn(),
}));

vi.mock('@components/account/MetaplexNFTHeader', () => ({
    MetaplexNFTHeader: () => <div data-testid="metaplex-nft-header">Metaplex NFT Header</div>,
}));

vi.mock('@components/account/nftoken/NFTokenAccountHeader', () => ({
    NFTokenAccountHeader: () => <div data-testid="nftoken-header">NFToken Header</div>,
}));

vi.mock('@components/account/CompressedNftCard', () => ({
    CompressedNftAccountHeader: () => <div data-testid="compressed-nft-header">Compressed NFT Header</div>,
}));

vi.mock('@providers/accounts', () => ({
    isTokenProgramData: vi.fn(() => false),
    isUpgradeableLoaderAccountData: vi.fn(() => true),
    useMintAccountInfo: vi.fn(() => undefined),
}));

vi.mock('@providers/compressed-nft', () => ({
    useMetadataJsonLink: vi.fn(() => undefined),
}));

vi.mock('@providers/accounts/utils/isMetaplexNFT', () => ({
    default: vi.fn(() => false),
}));

vi.mock('@components/account/nftoken/isNFTokenAccount', () => ({
    isNFTokenAccount: vi.fn(() => false),
}));

vi.mock('@utils/token-info', () => ({
    isRedactedTokenAddress: vi.fn(() => false),
}));

describe('AccountHeader', () => {
    describe('ProgramHeader', () => {
        beforeEach(() => {
            vi.clearAllMocks();
            vi.unstubAllEnvs();
        });

        it('should render with default values when no security.txt is available', () => {
            const { account, mockAddress } = setup();
            render(
                <AccountHeader
                    address={mockAddress}
                    account={account}
                    tokenInfo={undefined}
                    isTokenInfoLoading={false}
                />
            );

            expect(screen.getByText('Program account')).toBeInTheDocument();
            expect(screen.getByText('Program Account')).toBeInTheDocument();
            expect(screen.getByAltText('Program logo placeholder')).toBeInTheDocument();
        });

        it('should render with PMP security.txt data including logo and version', () => {
            const pmpSecurityTxt = createPmpSecurityTxt();
            vi.mocked(useSecurityTxt).mockReturnValue(pmpSecurityTxt);

            const { account, mockAddress } = setup();
            render(
                <AccountHeader
                    address={mockAddress}
                    account={account}
                    tokenInfo={undefined}
                    isTokenInfoLoading={false}
                />
            );

            expect(screen.getByText('Program account')).toBeInTheDocument();
            expect(screen.getByText('Test Program')).toBeInTheDocument();
            expect(screen.getByText('1.0.0')).toBeInTheDocument();

            const logoImg = screen.getByAltText('Program logo');
            expect(logoImg).toBeInTheDocument();
            expect(logoImg).toHaveAttribute('src', 'https://example.com/logo.png');
        });

        it('should use proxy for logo if enabled', () => {
            vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', 'true');
            const pmpSecurityTxt = createPmpSecurityTxt();
            vi.mocked(useSecurityTxt).mockReturnValue(pmpSecurityTxt);

            const { account, mockAddress } = setup();
            render(
                <AccountHeader
                    address={mockAddress}
                    account={account}
                    tokenInfo={undefined}
                    isTokenInfoLoading={false}
                />
            );

            const logoImg = screen.getByAltText('Program logo');
            expect(logoImg).toHaveAttribute('src', '/api/metadata/proxy?uri=https%3A%2F%2Fexample.com%2Flogo.png');
        });

        it('should render with Neodyme security.txt data (no logo or version)', () => {
            const neodymeSecurityTxt = createNeodymeSecurityTxt();
            vi.mocked(useSecurityTxt).mockReturnValue(neodymeSecurityTxt);

            const { account, mockAddress } = setup();
            render(
                <AccountHeader
                    address={mockAddress}
                    account={account}
                    tokenInfo={undefined}
                    isTokenInfoLoading={false}
                />
            );

            expect(screen.getByText('Program account')).toBeInTheDocument();
            expect(screen.getByText('Test Program')).toBeInTheDocument();
            expect(screen.getByAltText('Program logo placeholder')).toBeInTheDocument();
            expect(screen.queryByText('1.0.0')).not.toBeInTheDocument();
            expect(screen.queryByAltText('Program logo')).not.toBeInTheDocument();
        });

        it('should render with unverified tooltip', () => {
            vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', 'true');
            const pmpSecurityTxt = createPmpSecurityTxt();
            vi.mocked(useSecurityTxt).mockReturnValue(pmpSecurityTxt);

            const { account, mockAddress } = setup();
            render(
                <AccountHeader
                    address={mockAddress}
                    account={account}
                    tokenInfo={undefined}
                    isTokenInfoLoading={false}
                />
            );

            expect(screen.getByText('Unverified')).toBeInTheDocument();
        });
    });
});

function setup(): { account: Account; mockAddress: string } {
    const mockAddress = 'ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S';

    const parsedData: UpgradeableLoaderAccountData = {
        parsed: {
            info: {
                programData: PublicKey.default,
            },
            type: 'program',
        },
        program: 'bpf-upgradeable-loader',
    };

    return {
        account: {
            data: {
                parsed: parsedData,
            },
            executable: true,
            lamports: 0,
            owner: PublicKey.default,
            pubkey: new PublicKey(mockAddress),
            space: 0,
        },
        mockAddress,
    };
}
