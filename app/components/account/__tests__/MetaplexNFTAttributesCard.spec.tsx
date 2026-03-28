import { none, some } from '@metaplex-foundation/umi';
import { TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import { PublicKey } from '@solana/web3.js';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MetaplexNFTAttributesCard } from '@/app/components/account/MetaplexNFTAttributesCard';
import type { Account, TokenProgramData } from '@/app/providers/accounts';

vi.mock('@/app/providers/cluster', () => ({
    useCluster: vi.fn(() => ({ cluster: 'mainnet-beta', url: 'https://api.mainnet-beta.solana.com' })),
}));

vi.mock('@/app/providers/compressed-nft', () => ({
    useCompressedNft: vi.fn(() => null),
}));

vi.mock('@/app/features/metadata/utils', () => ({
    getProxiedUri: vi.fn((uri: string) => uri),
}));

function makeAccount(metadataUri: string): Account {
    const parsedData: TokenProgramData = {
        nftData: {
            editionInfo: {},
            json: undefined,
            metadata: {
                collection: none(),
                collectionDetails: none(),
                creators: none(),
                editionNonce: some(255),
                header: {} as any,
                isMutable: true,
                key: 4,
                mint: PublicKey.default.toString() as any,
                name: 'Test NFT',
                primarySaleHappened: false,
                programmableConfig: none(),
                publicKey: PublicKey.default.toString() as any,
                sellerFeeBasisPoints: 500,
                symbol: 'TEST',
                tokenStandard: some(0),
                updateAuthority: PublicKey.default.toString() as any,
                uri: metadataUri,
                uses: none(),
            } as any,
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

    it('renders attributes table after successful fetch', async () => {
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

    it('shows error card when fetch fails', async () => {
        global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

        const account = makeAccount('https://example.com/metadata.json');
        const onNotFound = vi.fn() as any;

        render(<MetaplexNFTAttributesCard account={account} onNotFound={onNotFound} />);

        await waitFor(() => {
            expect(screen.getByText('Failed to fetch attributes')).toBeDefined();
        });
    });
});
