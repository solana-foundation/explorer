import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { AccountHeader } from '@/app/components/account/AccountHeader';
import { useSecurityTxt } from '@/app/features/security-txt';
import { createNeodymeSecurityTxt, createPmpSecurityTxt } from '@/app/features/security-txt/ui/__tests__/helpers';
import type { Account, UpgradeableLoaderAccountData } from '@/app/providers/accounts';
import { Cluster } from '@/app/utils/cluster';
import { PROGRAM_INFO_BY_ID } from '@/app/utils/programs';

vi.mock('@/app/providers/cluster', () => ({
    useCluster: vi.fn(() => ({
        cluster: Cluster.MainnetBeta,
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

vi.mock('@entities/nft', async () => ({
    ...(await vi.importActual('@entities/nft')),
    isMetaplexNFT: vi.fn(() => false),
}));

vi.mock('@components/account/nftoken/isNFTokenAccount', () => ({
    isNFTokenAccount: vi.fn(() => false),
}));

vi.mock('@utils/token-info', () => ({
    isRedactedTokenAddress: vi.fn(() => false),
}));

const NON_TRUSTED_ADDRESS = '11111111111111111111111111111112';
const TRUSTED_ADDRESS = '11111111111111111111111111111111';
const TRUSTED_NAME = PROGRAM_INFO_BY_ID[TRUSTED_ADDRESS].name;

describe('AccountHeader', () => {
    describe('ProgramHeader', () => {
        beforeEach(() => {
            vi.clearAllMocks();
            vi.unstubAllEnvs();
            vi.mocked(useSecurityTxt).mockReturnValue({ isLoading: false, securityTxt: undefined });
        });

        it('should render with default values when no security.txt is available for non-trusted program', () => {
            renderHeader(NON_TRUSTED_ADDRESS);

            expect(screen.getByText('Program account')).toBeInTheDocument();
            expect(screen.getByText('Program Account')).toBeInTheDocument();
            // No logo: ProxiedImage shows its decorative placeholder (empty alt), not a named logo image.
            expect(screen.queryByAltText('Program logo')).not.toBeInTheDocument();
        });

        it.each([
            { address: NON_TRUSTED_ADDRESS, kind: 'non-trusted', name: 'Test Program' },
            { address: TRUSTED_ADDRESS, kind: 'trusted', name: TRUSTED_NAME },
        ])('should render PMP security.txt logo and version for $kind program', ({ address, name }) => {
            vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', 'false');
            vi.mocked(useSecurityTxt).mockReturnValue({ isLoading: false, securityTxt: createPmpSecurityTxt() });

            renderHeader(address);

            expect(screen.getByText(name)).toBeInTheDocument();
            expect(screen.getByText('1.0.0')).toBeInTheDocument();
            expect(screen.getByAltText('Program logo')).toHaveAttribute('src', 'https://example.com/logo.png');
        });

        it('should use proxy for logo if enabled', () => {
            vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', 'true');
            vi.mocked(useSecurityTxt).mockReturnValue({ isLoading: false, securityTxt: createPmpSecurityTxt() });

            renderHeader(NON_TRUSTED_ADDRESS);

            const logoImg = screen.getByAltText('Program logo');
            expect(logoImg).toHaveAttribute('src', '/api/metadata/proxy?uri=https%3A%2F%2Fexample.com%2Flogo.png');
        });

        it.each([
            { address: NON_TRUSTED_ADDRESS, kind: 'non-trusted', name: 'Test Program' },
            { address: TRUSTED_ADDRESS, kind: 'trusted', name: TRUSTED_NAME },
        ])('should render Neodyme security.txt data without logo or version for $kind program', ({ address, name }) => {
            vi.mocked(useSecurityTxt).mockReturnValue({ isLoading: false, securityTxt: createNeodymeSecurityTxt() });

            renderHeader(address);

            expect(screen.getByText(name)).toBeInTheDocument();
            expect(screen.queryByText('1.0.0')).not.toBeInTheDocument();
            // No logo: only ProxiedImage's decorative placeholder (empty alt), no named logo image.
            expect(screen.queryByAltText('Program logo')).not.toBeInTheDocument();
        });

        it('should render with self-reported warning icon', () => {
            vi.mocked(useSecurityTxt).mockReturnValue({ isLoading: false, securityTxt: createPmpSecurityTxt() });

            renderHeader(NON_TRUSTED_ADDRESS);

            expect(screen.getByLabelText('Self-reported program')).toBeInTheDocument();
        });
    });

    describe('stake account', () => {
        beforeEach(() => {
            vi.clearAllMocks();
            vi.mocked(useSecurityTxt).mockReturnValue({ isLoading: false, securityTxt: undefined });
        });

        it('should render the "Stake Account" title instead of the generic "Account" fallback', () => {
            const stakeAddress = '5ASxtmcPKDeD8NoE5QpskizPokqDdX1qHFiqZb1spLdo';
            const account = {
                data: { parsed: { parsed: { type: 'delegated' }, program: 'stake' } },
                executable: false,
                lamports: 100,
                owner: PublicKey.default,
                pubkey: new PublicKey(stakeAddress),
                space: 200,
            } as unknown as Account;

            render(<AccountHeader address={stakeAddress} account={account} tokenInfo={undefined} isTokenInfoLoading />);

            expect(screen.getByRole('heading', { name: 'Stake Account' })).toBeInTheDocument();
            expect(screen.queryByRole('heading', { name: 'Account' })).not.toBeInTheDocument();
        });
    });
});

function renderHeader(address: string) {
    render(
        <AccountHeader
            address={address}
            account={programAccount(address)}
            tokenInfo={undefined}
            isTokenInfoLoading={false}
        />,
    );
}

function programAccount(address: string): Account {
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
        data: {
            parsed: parsedData,
        },
        executable: true,
        lamports: 0,
        owner: PublicKey.default,
        pubkey: new PublicKey(address),
        space: 0,
    };
}
