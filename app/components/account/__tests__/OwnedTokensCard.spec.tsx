import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublicKey } from '@solana/web3.js';
import React from 'react';
import { vi } from 'vitest';

import { OwnedTokensCard } from '@/app/components/account/OwnedTokensCard';
import { FetchStatus } from '@/app/providers/cache';
import type { TokenInfoWithPubkey } from '@/app/providers/accounts/tokens';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(() => '/address/mock/tokens'),
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}));

vi.mock('next/image', () => ({
    __esModule: true,
    default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock('@components/common/Address', () => ({
    Address: ({ pubkey }: { pubkey: { toBase58: () => string } }) => <span>{pubkey.toBase58()}</span>,
}));

vi.mock('@components/account/token-extensions/ScaledUiAmountMultiplierTooltip', () => ({
    __esModule: true,
    default: () => null,
}));

vi.mock('@providers/accounts/tokens', async () => {
    const actual = await vi.importActual<typeof import('@providers/accounts/tokens')>(
        '@providers/accounts/tokens'
    );
    return {
        ...actual,
        useAccountOwnedTokens: vi.fn(),
        useFetchAccountOwnedTokens: vi.fn(),
        useScaledUiAmountForMint: vi.fn(() => ['0', '1']),
    };
});

import {
    useAccountOwnedTokens,
    useFetchAccountOwnedTokens,
} from '@providers/accounts/tokens';

describe('OwnedTokensCard', () => {
    const mockAddress = '7gN7aPfYZ7R6pujYnXghDUFxuDrGRq3NbS1hVeXeXzKZ';
    const solMint = new PublicKey('So11111111111111111111111111111111111111112');
    const bonkMint = new PublicKey('DezXAZ8z7PnrnRJgsSummSgGDn8uQmSez2w6zxDd4kPx');
    const mockTokens: TokenInfoWithPubkey[] = [
        {
            info: {
                isNative: false,
                mint: solMint,
                owner: new PublicKey('11111111111111111111111111111111'),
                state: 'initialized',
                tokenAmount: {
                    amount: '1000000000',
                    decimals: 9,
                    uiAmountString: '1',
                },
            },
            name: 'Solana',
            pubkey: new PublicKey('H3Y2Yk4EYBLETymFcpnSUsctNkYheAQ7EzxKQEiC5c6a'),
            symbol: 'SOL',
        },
        {
            info: {
                isNative: false,
                mint: bonkMint,
                owner: new PublicKey('11111111111111111111111111111111'),
                state: 'initialized',
                tokenAmount: {
                    amount: '500000',
                    decimals: 5,
                    uiAmountString: '5',
                },
            },
            name: 'Bonk',
            pubkey: new PublicKey('3h6sEBQZG9hV91bLbX6FVUFYttGjoHNJpX15HwNhEx27'),
            symbol: 'BONK',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAccountOwnedTokens).mockReturnValue({
            data: { tokens: mockTokens },
            status: FetchStatus.Fetched,
        });
        vi.mocked(useFetchAccountOwnedTokens).mockReturnValue(vi.fn());
    });

    it('filters tokens using the find-as-you-type input', async () => {
        const user = userEvent.setup();
        render(<OwnedTokensCard address={mockAddress} />);

        const input = screen.getByPlaceholderText('Find token');
        await user.type(input, 'bonk');

        expect(screen.getByText(bonkMint.toBase58())).toBeInTheDocument();
        expect(screen.queryByText(solMint.toBase58())).not.toBeInTheDocument();
        expect(screen.queryByText('No tokens match this search')).not.toBeInTheDocument();
    });

    it('shows an empty state message when no tokens match the filter', async () => {
        const user = userEvent.setup();
        render(<OwnedTokensCard address={mockAddress} />);

        const input = screen.getByPlaceholderText('Find token');
        await user.type(input, 'missing-token');

        expect(screen.getByText('No tokens match this search')).toBeInTheDocument();
        expect(screen.queryByText(solMint.toBase58())).not.toBeInTheDocument();
        expect(screen.queryByText(bonkMint.toBase58())).not.toBeInTheDocument();
    });
});
