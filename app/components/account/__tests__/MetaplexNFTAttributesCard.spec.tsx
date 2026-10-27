import { TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import { PublicKey } from '@solana/web3.js';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MetaplexNFTAttributesCard } from '@/app/components/account/MetaplexNFTAttributesCard';
import { makeMetadata } from '@/app/entities/nft/__fixtures__/make-nft-data';
import type { Account, TokenProgramData } from '@/app/providers/accounts';

vi.mock('@/app/providers/cluster', () => ({
    useCluster: vi.fn(() => ({ cluster: 'mainnet-beta', url: 'https://api.mainnet-beta.solana.com' })),
}));

vi.mock('@/app/providers/compressed-nft', () => ({
    useCompressedNft: vi.fn(() => null),
}));

function makeAccount(metadataUri: string): Account {
    const parsedData: TokenProgramData = {
        nftData: {
            editionInfo: {},
            json: undefined,
            metadata: makeMetadata({ uri: metadataUri }),
        },
        parsed: { info: {}, type: 'mint' } as any,
        program: 'spl-token' as const,
    };
    return {
        data: { parsed: parsedData, raw: Buffer.alloc(0) },
        executable: false,
        lamports: 1_000_000,
        owner: TOKEN_PROGRAM_ID,
        pubkey: PublicKey.default,
        space: 0,
    };
}

describe('MetaplexNFTAttributesCard', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('should render attributes table after successful fetch', async () => {
        const mockAttributes = {
            attributes: [
                { trait_type: 'Background', value: 'Blue' },
                { trait_type: 'Rarity', value: 'Legendary' },
            ],
        };
        global.fetch = vi.fn().mockResolvedValueOnce({
            json: () => Promise.resolve(mockAttributes),
        });

        const account = makeAccount('https://example.com/metadata.json');
        const onNotFound = vi.fn() as any;

        render(<MetaplexNFTAttributesCard account={account} onNotFound={onNotFound} />);

        await waitFor(() => {
            expect(screen.getByText('Background')).toBeDefined();
        });
        expect(screen.getByText('Blue')).toBeDefined();
        expect(screen.getByText('Rarity')).toBeDefined();
        expect(screen.getByText('Legendary')).toBeDefined();
    });

    it('should show error card when fetch fails', async () => {
        global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

        const account = makeAccount('https://example.com/metadata.json');
        const onNotFound = vi.fn() as any;

        render(<MetaplexNFTAttributesCard account={account} onNotFound={onNotFound} />);

        await waitFor(() => {
            expect(screen.getByText('Failed to fetch attributes')).toBeDefined();
        });
    });

    it('should refetch the attributes when the metadata URI changes', async () => {
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce(attributesResponse('Blue'))
            .mockResolvedValueOnce(attributesResponse('Red'));
        const onNotFound = vi.fn<() => never>();
        const { rerender } = render(
            <MetaplexNFTAttributesCard account={makeAccount('https://example.com/1.json')} onNotFound={onNotFound} />,
        );
        expect(await screen.findByText('Blue')).toBeInTheDocument();

        rerender(
            <MetaplexNFTAttributesCard account={makeAccount('https://example.com/2.json')} onNotFound={onNotFound} />,
        );

        expect(await screen.findByText('Red')).toBeInTheDocument();
    });

    it('should show the loading card while the attributes of a new metadata URI load', async () => {
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce(attributesResponse('Blue'))
            .mockReturnValueOnce(new Promise(() => {}));
        const onNotFound = vi.fn<() => never>();
        const { rerender } = render(
            <MetaplexNFTAttributesCard account={makeAccount('https://example.com/1.json')} onNotFound={onNotFound} />,
        );
        expect(await screen.findByText('Blue')).toBeInTheDocument();

        rerender(
            <MetaplexNFTAttributesCard account={makeAccount('https://example.com/2.json')} onNotFound={onNotFound} />,
        );

        expect(await screen.findByText('Loading')).toBeInTheDocument();
        expect(screen.queryByText('Blue')).not.toBeInTheDocument();
    });

    it('should ignore the attributes of the previous metadata URI when they arrive last', async () => {
        let resolvePreviousFetch: (response: unknown) => void = () => {};
        global.fetch = vi
            .fn()
            .mockReturnValueOnce(new Promise(resolve => (resolvePreviousFetch = resolve)))
            .mockResolvedValueOnce(attributesResponse('Red'));
        const onNotFound = vi.fn<() => never>();
        const { rerender } = render(
            <MetaplexNFTAttributesCard account={makeAccount('https://example.com/1.json')} onNotFound={onNotFound} />,
        );
        rerender(
            <MetaplexNFTAttributesCard account={makeAccount('https://example.com/2.json')} onNotFound={onNotFound} />,
        );
        expect(await screen.findByText('Red')).toBeInTheDocument();

        await act(async () => {
            resolvePreviousFetch(attributesResponse('Blue'));
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(screen.getByText('Red')).toBeInTheDocument();
        expect(screen.queryByText('Blue')).not.toBeInTheDocument();
    });

    it('should ignore a fetch of the previous metadata URI that fails last', async () => {
        let rejectPreviousFetch: (error: Error) => void = () => {};
        global.fetch = vi
            .fn()
            .mockReturnValueOnce(new Promise((_, reject) => (rejectPreviousFetch = reject)))
            .mockResolvedValueOnce(attributesResponse('Red'));
        const onNotFound = vi.fn<() => never>();
        const { rerender } = render(
            <MetaplexNFTAttributesCard account={makeAccount('https://example.com/1.json')} onNotFound={onNotFound} />,
        );
        rerender(
            <MetaplexNFTAttributesCard account={makeAccount('https://example.com/2.json')} onNotFound={onNotFound} />,
        );
        expect(await screen.findByText('Red')).toBeInTheDocument();

        await act(async () => {
            rejectPreviousFetch(new Error('Network error'));
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(screen.getByText('Red')).toBeInTheDocument();
        expect(screen.queryByText('Failed to fetch attributes')).not.toBeInTheDocument();
    });

    it('should ignore a retry for the previous metadata URI that resolves last', async () => {
        let resolveRetry: (response: unknown) => void = () => {};
        global.fetch = vi
            .fn()
            .mockRejectedValueOnce(new Error('Network error'))
            .mockReturnValueOnce(new Promise(resolve => (resolveRetry = resolve)))
            .mockResolvedValueOnce(attributesResponse('Red'));
        const onNotFound = vi.fn<() => never>();
        const { rerender } = render(
            <MetaplexNFTAttributesCard account={makeAccount('https://example.com/1.json')} onNotFound={onNotFound} />,
        );
        await screen.findByText('Failed to fetch attributes');
        await userEvent.click(screen.getAllByText('Try Again')[0]);
        rerender(
            <MetaplexNFTAttributesCard account={makeAccount('https://example.com/2.json')} onNotFound={onNotFound} />,
        );
        expect(await screen.findByText('Red')).toBeInTheDocument();

        await act(async () => {
            resolveRetry(attributesResponse('Blue'));
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(screen.getByText('Red')).toBeInTheDocument();
        expect(screen.queryByText('Blue')).not.toBeInTheDocument();
    });

    it('should refetch the attributes on retry after a failed fetch', async () => {
        global.fetch = vi
            .fn()
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce(attributesResponse('Blue'));
        render(
            <MetaplexNFTAttributesCard
                account={makeAccount('https://example.com/metadata.json')}
                onNotFound={vi.fn<() => never>()}
            />,
        );
        await screen.findByText('Failed to fetch attributes');

        await userEvent.click(screen.getAllByText('Try Again')[0]);

        expect(await screen.findByText('Blue')).toBeInTheDocument();
    });

    it('should skip the browser cache when it retries after a failed fetch', async () => {
        const cachedProxyError = { json: () => Promise.resolve({ error: 'Bad Gateway' }) };
        global.fetch = vi
            .fn()
            .mockImplementation(async (_uri: string, init?: RequestInit) =>
                init?.cache === 'no-cache' ? attributesResponse('Blue') : cachedProxyError,
            );
        render(
            <MetaplexNFTAttributesCard
                account={makeAccount('https://example.com/metadata.json')}
                onNotFound={vi.fn<() => never>()}
            />,
        );
        await screen.findByText('Failed to fetch attributes');

        await userEvent.click(screen.getAllByText('Try Again')[0]);

        expect(await screen.findByText('Blue')).toBeInTheDocument();
    });
});

function attributesResponse(background: string) {
    return { json: () => Promise.resolve({ attributes: [{ trait_type: 'Background', value: background }] }) };
}
