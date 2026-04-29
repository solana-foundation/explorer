import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { TokenAccountSection } from '../TokenAccountSection';

vi.mock('@components/account/token-extensions/ScaledUiAmountMultiplierTooltip', () => ({
    default: () => null,
}));

vi.mock('@components/common/Address', () => ({
    Address: ({ pubkey }: { pubkey: PublicKey }) => <span>{pubkey.toBase58()}</span>,
}));

vi.mock('@components/common/Copyable', () => ({
    Copyable: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@entities/account', () => ({
    useRefreshAccount: () => vi.fn(),
}));

vi.mock('@entities/nft', () => ({
    isMetaplexNFT: () => false,
}));

vi.mock('@features/account', () => ({
    AccountCard: ({ children }: { children: React.ReactNode }) => (
        <table>
            <tbody>{children}</tbody>
        </table>
    ),
}));

vi.mock('@providers/cluster', async importOriginal => {
    const actual = await importOriginal<typeof import('@providers/cluster')>();
    return {
        ...actual,
        useCluster: () => ({ cluster: 'mainnet-beta' }),
    };
});

vi.mock('../UnknownAccountCard', () => ({
    UnknownAccountCard: () => <div>Unknown account</div>,
}));

vi.mock('../token-extensions/TokenExtensionsStatusRow', () => ({
    TokenExtensionsStatusRow: () => null,
}));

const mintAuthority = PublicKey.default;
const mintAccount = {
    data: {
        parsed: {
            nftData: undefined,
            parsed: {},
            program: 'spl-token',
        },
    },
    executable: false,
    lamports: 0,
    owner: mintAuthority,
    pubkey: mintAuthority,
};

const mintTokenAccount = {
    info: {
        decimals: 6,
        freezeAuthority: null,
        isInitialized: true,
        mintAuthority: null,
        supply: '1000000',
    },
    type: 'mint',
} as const;

describe('TokenAccountSection', () => {
    it('does not render unsafe website values as clickable links', () => {
        render(
            <TokenAccountSection
                account={mintAccount as any}
                tokenAccount={mintTokenAccount as any}
                tokenInfo={
                    {
                        extensions: {
                            website: 'javascript:alert(1)',
                        },
                    } as any
                }
            />,
        );

        expect(screen.getByText('javascript:alert(1)')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'javascript:alert(1)' })).not.toBeInTheDocument();
    });

    it('uses the asset contract URL for the bridged asset row', () => {
        const bridgeContractUrl = 'https://etherscan.io/address/0x1111111111111111111111111111111111111111';
        const assetContractUrl = 'https://arbiscan.io/token/0x2222222222222222222222222222222222222222';
        const assetContractAddress = '0x2222222222222222222222222222222222222222';

        render(
            <TokenAccountSection
                account={mintAccount as any}
                tokenAccount={mintTokenAccount as any}
                tokenInfo={
                    {
                        extensions: {
                            assetContract: assetContractUrl,
                            bridgeContract: bridgeContractUrl,
                        },
                    } as any
                }
            />,
        );

        expect(screen.getByRole('link', { name: assetContractAddress })).toHaveAttribute('href', assetContractUrl);
    });
});
