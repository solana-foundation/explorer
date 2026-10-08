import type { Account } from '@providers/accounts';
import { act, render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    accountBytes,
    collectionAccount,
    MAINNET_COLLECTION,
    MAINNET_NFTS,
    NFT_CAN_UPDATE_OFFSET,
    nftokenAccount,
} from '../../__tests__/fixtures';
import { parseNftokenAccount } from '../../lib/nftoken-accounts';
import { NftokenAccountHeader } from '../NftokenAccountHeader';

const mocks = vi.hoisted(() => ({ fetchNftokenMetadata: vi.fn() }));

vi.mock('../../api/fetch-nftoken-metadata', () => ({ fetchNftokenMetadata: mocks.fetchNftokenMetadata }));

const [NFT] = MAINNET_NFTS;
const NAMED = { kind: 'loaded', metadata: { image: undefined, name: 'Genesis: friends.glow' } } as const;

afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
});

describe('NftokenAccountHeader', () => {
    it('should show the NFT name from the metadata at its URL', async () => {
        mocks.fetchNftokenMetadata.mockResolvedValue(NAMED);

        renderHeader(nftokenAccount(accountBytes(NFT.base64), NFT.pubkey));

        expect(await screen.findByRole('heading', { name: 'Genesis: friends.glow' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'NFToken NFT' })).toBeInTheDocument();
        expect(screen.getByText('Mutable')).toBeInTheDocument();
        expect(mocks.fetchNftokenMetadata).toHaveBeenCalledExactlyOnceWith(NFT.metadataUrl);
    });

    it('should show a collection under the collection label', async () => {
        mocks.fetchNftokenMetadata.mockResolvedValue(NAMED);

        renderHeader(collectionAccount());

        expect(await screen.findByRole('heading', { name: 'NFToken Collection' })).toBeInTheDocument();
        expect(mocks.fetchNftokenMetadata).toHaveBeenCalledExactlyOnceWith(MAINNET_COLLECTION.metadataUrl);
    });

    it('should show Immutable for an NFT whose authority cannot update it', async () => {
        mocks.fetchNftokenMetadata.mockResolvedValue(NAMED);
        const data = accountBytes(NFT.base64);
        data[NFT_CAN_UPDATE_OFFSET] = 0;

        renderHeader(nftokenAccount(data, NFT.pubkey));

        expect(await screen.findByText('Immutable')).toBeInTheDocument();
    });

    it('should stop requesting the metadata after two retries', async () => {
        vi.useFakeTimers();
        mocks.fetchNftokenMetadata.mockRejectedValue(new Error('NFToken metadata fetch failed: 503'));

        renderHeader(nftokenAccount(accountBytes(NFT.base64), NFT.pubkey));
        await act(() => vi.advanceTimersByTimeAsync(10 * 60_000));

        expect(mocks.fetchNftokenMetadata).toHaveBeenCalledTimes(3);
        expect(screen.getByRole('heading', { name: 'Failed to load metadata' })).toBeInTheDocument();
    });
});

function renderHeader(account: Account) {
    const nftoken = parseNftokenAccount(account);
    if (!nftoken) throw new Error('the fixture does not decode');
    return render(<NftokenAccountHeader nftoken={nftoken} />, { wrapper: Providers });
}

function Providers({ children }: { children: ReactNode }) {
    return <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>{children}</SWRConfig>;
}
