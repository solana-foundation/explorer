import { TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Header } from '@/app/components/Header';
import { makeNftData } from '@/app/entities/nft/lib/__tests__/make-nft-data';
import { useTokenMarketData } from '@/app/features/token-market-data';
import type { Account, NFTData, TokenProgramData } from '@/app/providers/accounts';
import { useMintAccountInfo } from '@/app/providers/accounts';

vi.mock('@components/account/AccountHeader', () => ({ AccountHeader: () => null }));
vi.mock('@/app/features/token-verification-badge', () => ({ TokenVerificationBadge: () => <div>Verification</div> }));
vi.mock('@/app/features/token-market-data', () => ({
    TokenMarketData: () => <div>Market data</div>,
    useTokenMarketData: vi.fn(),
}));
vi.mock('@/app/providers/accounts', async importOriginal => ({
    ...(await importOriginal<typeof import('@/app/providers/accounts')>()),
    useMintAccountInfo: vi.fn(),
}));
vi.mock('@/app/shared/model/token-program', () => ({
    isNativeMint: () => false,
    isTokenMintByOwner: () => true,
}));

const ADDRESS = 'So11111111111111111111111111111111111111113';

describe('Header', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show the token verification and market data for a fungible token mint', () => {
        vi.mocked(useMintAccountInfo).mockReturnValue(mintInfo({ decimals: 6, supply: '1000000' }));

        render(<Header address={ADDRESS} account={makeMintAccount()} isTokenInfoLoading={false} />);

        expect(screen.getByText('Verification')).toBeInTheDocument();
        expect(screen.getByText('Market data')).toBeInTheDocument();
        expect(useTokenMarketData).toHaveBeenCalledWith(ADDRESS, true);
    });

    it('should hide the token verification and market data for an NFT mint', () => {
        vi.mocked(useMintAccountInfo).mockReturnValue(mintInfo({ decimals: 0, supply: '1' }));

        render(<Header address={ADDRESS} account={makeMintAccount(makeNftData())} isTokenInfoLoading={false} />);

        expect(screen.queryByText('Verification')).not.toBeInTheDocument();
        expect(screen.queryByText('Market data')).not.toBeInTheDocument();
        expect(useTokenMarketData).toHaveBeenCalledWith(ADDRESS, false);
    });
});

function makeMintAccount(nftData?: NFTData): Account {
    const parsed: TokenProgramData = {
        nftData,
        parsed: { info: {}, type: 'mint' } as TokenProgramData['parsed'],
        program: 'spl-token',
    };
    return {
        data: { parsed, raw: Buffer.alloc(82) },
        executable: false,
        lamports: 1_000_000,
        owner: TOKEN_PROGRAM_ID,
        pubkey: new PublicKey(ADDRESS),
        space: 82,
    };
}

function mintInfo({ decimals, supply }: { decimals: number; supply: string }) {
    return { decimals, freezeAuthority: null, isInitialized: true, mintAuthority: null, supply } as ReturnType<
        typeof useMintAccountInfo
    >;
}
