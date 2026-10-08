import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';
import { VisibilityProvider } from '@/app/shared/lib/visibility';

import { COLLECTION, MAINNET_NFT_ACCOUNTS } from '../../__tests__/fixtures';
import { NftokenCollectionGrid } from '../NftokenCollectionGrid';

const mocks = vi.hoisted(() => ({
    fetchCollectionNfts: vi.fn(),
    fetchNftokenMetadata: vi.fn(),
    useCluster: vi.fn(),
}));

vi.mock('@entities/cluster', () => ({
    useCluster: mocks.useCluster,
    useClusterPath: ({ pathname }: { pathname: string }) => pathname,
}));
vi.mock('../../api/fetch-collection-nfts', () => ({ fetchCollectionNfts: mocks.fetchCollectionNfts }));
vi.mock('../../api/fetch-nftoken-metadata', () => ({ fetchNftokenMetadata: mocks.fetchNftokenMetadata }));

let observed: Map<Element, IntersectionObserverCallback>;

beforeEach(() => {
    mocks.useCluster.mockReturnValue({ connectableUrl: 'https://mock.rpc' });
    observed = new Map();
    vi.stubGlobal(
        'IntersectionObserver',
        vi.fn(function (callback: IntersectionObserverCallback) {
            return {
                disconnect: vi.fn(),
                observe: (element: Element) => observed.set(element, callback),
                unobserve: (element: Element) => observed.delete(element),
            };
        }),
    );
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

describe('NftokenCollectionGrid', () => {
    it('should render every NFT in the order given before any metadata is requested', async () => {
        mocks.fetchCollectionNfts.mockResolvedValue({
            kind: 'loaded',
            nfts: MAINNET_NFT_ACCOUNTS,
            undecodableCount: 0,
        });

        renderGrid();

        const tiles = await screen.findAllByRole('link', { name: 'Loading...' });
        expect(tiles.map(tile => tile.getAttribute('href'))).toEqual(
            MAINNET_NFT_ACCOUNTS.map(nft => `/address/${nft.address}`),
        );
        expect(mocks.fetchNftokenMetadata).not.toHaveBeenCalled();
    });

    it('should request metadata only for a tile that becomes visible', async () => {
        mocks.fetchCollectionNfts.mockResolvedValue({
            kind: 'loaded',
            nfts: MAINNET_NFT_ACCOUNTS,
            undecodableCount: 0,
        });
        mocks.fetchNftokenMetadata.mockResolvedValue({
            kind: 'loaded',
            metadata: { image: undefined, name: 'Genesis: friends.glow' },
        });
        renderGrid();
        await screen.findAllByRole('link', { name: 'Loading...' });

        showTile(1);

        expect(await screen.findByRole('link', { name: 'Genesis: friends.glow' })).toHaveAttribute(
            'href',
            `/address/${MAINNET_NFT_ACCOUNTS[1].address}`,
        );
        expect(mocks.fetchNftokenMetadata).toHaveBeenCalledOnce();
        expect(mocks.fetchNftokenMetadata).toHaveBeenCalledWith(MAINNET_NFT_ACCOUNTS[1].metadata_url);
        expect(screen.getAllByRole('link', { name: 'Loading...' })).toHaveLength(2);
    });

    it('should link the original image from the metadata of a visible tile', async () => {
        const image = 'https://cdn.glow.app/g/5e/rwwih1nsp8.png';
        mocks.fetchCollectionNfts.mockResolvedValue({
            kind: 'loaded',
            nfts: [MAINNET_NFT_ACCOUNTS[0]],
            undecodableCount: 0,
        });
        mocks.fetchNftokenMetadata.mockResolvedValue({
            kind: 'loaded',
            metadata: { image, name: 'Genesis: friends.glow' },
        });
        renderGrid();
        await screen.findByRole('link', { name: 'Loading...' });

        showTile(0);

        expect(await screen.findByRole('link', { name: 'View original' })).toHaveAttribute('href', image);
    });

    it.each([
        ['unavailable', 'No Name', () => mocks.fetchNftokenMetadata.mockResolvedValue({ kind: 'unavailable' })],
        [
            'failed',
            'Failed to load metadata',
            () => mocks.fetchNftokenMetadata.mockRejectedValue(new Error('NFToken metadata fetch failed: 503')),
        ],
    ])('should name a visible tile with %s metadata "%s"', async (_, name, arrange) => {
        mocks.fetchCollectionNfts.mockResolvedValue({
            kind: 'loaded',
            nfts: [MAINNET_NFT_ACCOUNTS[0]],
            undecodableCount: 0,
        });
        arrange();
        renderGrid();

        await screen.findByRole('link', { name: 'Loading...' });
        showTile(0);

        expect(await screen.findByRole('link', { name })).toBeInTheDocument();
    });

    it('should request the metadata of a visible tile again when the user refreshes', async () => {
        mocks.fetchCollectionNfts.mockResolvedValue({
            kind: 'loaded',
            nfts: [MAINNET_NFT_ACCOUNTS[0]],
            undecodableCount: 0,
        });
        mocks.fetchNftokenMetadata.mockRejectedValueOnce(new Error('NFToken metadata fetch failed: 503'));
        mocks.fetchNftokenMetadata.mockResolvedValue({
            kind: 'loaded',
            metadata: { image: undefined, name: 'Genesis: friends.glow' },
        });
        renderGrid();
        await screen.findByRole('link', { name: 'Loading...' });
        showTile(0);
        await screen.findByRole('link', { name: 'Failed to load metadata' });

        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

        expect(await screen.findByRole('link', { name: 'Genesis: friends.glow' })).toBeInTheDocument();
        expect(mocks.fetchNftokenMetadata).toHaveBeenCalledTimes(2);
        expect(mocks.fetchCollectionNfts).toHaveBeenCalledTimes(2);
    });

    it('should disable the refresh button until the NFTs load again', async () => {
        let settle: (answer: unknown) => void = () => {};
        mocks.fetchCollectionNfts.mockResolvedValueOnce({
            kind: 'loaded',
            nfts: MAINNET_NFT_ACCOUNTS,
            undecodableCount: 0,
        });
        mocks.fetchCollectionNfts.mockReturnValueOnce(new Promise(resolve => (settle = resolve)));
        renderGrid();
        await screen.findAllByRole('link', { name: 'Loading...' });

        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

        await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled());
        await act(async () => settle({ kind: 'loaded', nfts: MAINNET_NFT_ACCOUNTS, undecodableCount: 0 }));
        expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled();
    });

    it('should keep the NFTs on screen when a refresh fails', async () => {
        const error = new Error('HTTP error (503)');
        mocks.fetchCollectionNfts.mockResolvedValueOnce({
            kind: 'loaded',
            nfts: MAINNET_NFT_ACCOUNTS,
            undecodableCount: 0,
        });
        mocks.fetchCollectionNfts.mockRejectedValueOnce(error);
        renderGrid();
        await screen.findAllByRole('link', { name: 'Loading...' });

        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

        await waitFor(() => expect(Logger.error).toHaveBeenCalledWith(error, { collection: COLLECTION }));
        expect(screen.getAllByRole('link', { name: 'Loading...' })).toHaveLength(MAINNET_NFT_ACCOUNTS.length);
        expect(screen.queryByText('Failed to load NFTs')).not.toBeInTheDocument();
    });

    it('should keep the name of a tile when a refresh of its metadata fails', async () => {
        const error = new Error('NFToken metadata fetch failed: 503');
        mocks.fetchCollectionNfts.mockResolvedValue({
            kind: 'loaded',
            nfts: [MAINNET_NFT_ACCOUNTS[0]],
            undecodableCount: 0,
        });
        mocks.fetchNftokenMetadata.mockResolvedValueOnce({
            kind: 'loaded',
            metadata: { image: undefined, name: 'Genesis: friends.glow' },
        });
        mocks.fetchNftokenMetadata.mockRejectedValueOnce(error);
        renderGrid();
        await screen.findByRole('link', { name: 'Loading...' });
        showTile(0);
        await screen.findByRole('link', { name: 'Genesis: friends.glow' });

        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

        await waitFor(() =>
            expect(Logger.error).toHaveBeenCalledWith(error, { uri: MAINNET_NFT_ACCOUNTS[0].metadata_url }),
        );
        expect(screen.getByRole('link', { name: 'Genesis: friends.glow' })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Failed to load metadata' })).not.toBeInTheDocument();
    });

    it('should send no request while the cluster has no connectable URL', () => {
        mocks.useCluster.mockReturnValue({ connectableUrl: undefined });

        renderGrid();

        expect(screen.getByText('Loading')).toBeInTheDocument();
        expect(mocks.fetchCollectionNfts).not.toHaveBeenCalled();
    });

    it('should list the NFTs of the new cluster when the cluster changes', async () => {
        mocks.fetchCollectionNfts.mockImplementation(async (url: string) => ({
            kind: 'loaded',
            nfts: url === 'https://mock.rpc' ? MAINNET_NFT_ACCOUNTS : [],
            undecodableCount: 0,
        }));
        const { rerender } = renderGrid();
        await screen.findAllByRole('link', { name: 'Loading...' });

        mocks.useCluster.mockReturnValue({ connectableUrl: 'https://other.rpc' });
        rerender(<NftokenCollectionGrid collection={COLLECTION} />);

        expect(await screen.findByText('No NFTs Found')).toBeInTheDocument();
        expect(mocks.fetchCollectionNfts).toHaveBeenLastCalledWith('https://other.rpc', COLLECTION);
    });

    it('should report a collection without NFTs', async () => {
        mocks.fetchCollectionNfts.mockResolvedValue({ kind: 'loaded', nfts: [], undecodableCount: 0 });

        renderGrid();

        expect(await screen.findByText('No NFTs Found')).toBeInTheDocument();
    });

    it('should report the NFT accounts that could not be decoded', async () => {
        mocks.fetchCollectionNfts.mockResolvedValue({
            kind: 'loaded',
            nfts: MAINNET_NFT_ACCOUNTS,
            undecodableCount: 2,
        });

        renderGrid();

        expect(await screen.findAllByRole('link', { name: 'Loading...' })).toHaveLength(MAINNET_NFT_ACCOUNTS.length);
        expect(screen.getByText('2 NFT accounts in this collection could not be decoded.')).toBeInTheDocument();
    });

    it('should report undecodable accounts instead of an empty collection when no account decodes', async () => {
        mocks.fetchCollectionNfts.mockResolvedValue({ kind: 'loaded', nfts: [], undecodableCount: 1 });

        renderGrid();

        expect(await screen.findByText('1 NFT account in this collection could not be decoded.')).toBeInTheDocument();
        expect(screen.queryByText('No NFTs Found')).not.toBeInTheDocument();
    });

    it('should report an endpoint that does not support getProgramAccounts without offering a retry', async () => {
        mocks.fetchCollectionNfts.mockResolvedValue({ kind: 'unsupported' });

        renderGrid();

        expect(await screen.findByText('This RPC endpoint does not support getProgramAccounts')).toBeInTheDocument();
        expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });

    it('should report an endpoint that refuses the request without offering a retry', async () => {
        mocks.fetchCollectionNfts.mockResolvedValue({ kind: 'refused' });

        renderGrid();

        expect(await screen.findByText('This RPC endpoint refused to list NFTs')).toBeInTheDocument();
        expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });

    it('should log the error when the NFTs fail to load', async () => {
        const error = new Error('HTTP error (503)');
        mocks.fetchCollectionNfts.mockRejectedValue(error);

        renderGrid();

        await screen.findByText('Failed to load NFTs');
        expect(Logger.error).toHaveBeenCalledWith(error, { collection: COLLECTION });
    });

    it('should log the error when a tile fails to load its metadata', async () => {
        const error = new Error('NFToken metadata fetch failed: 503');
        mocks.fetchCollectionNfts.mockResolvedValue({
            kind: 'loaded',
            nfts: [MAINNET_NFT_ACCOUNTS[0]],
            undecodableCount: 0,
        });
        mocks.fetchNftokenMetadata.mockRejectedValue(error);
        renderGrid();
        await screen.findByRole('link', { name: 'Loading...' });

        showTile(0);

        await screen.findByRole('link', { name: 'Failed to load metadata' });
        expect(Logger.error).toHaveBeenCalledWith(error, { uri: MAINNET_NFT_ACCOUNTS[0].metadata_url });
    });

    it('should list the NFTs again when the user retries a failed request', async () => {
        mocks.fetchCollectionNfts.mockRejectedValueOnce(new Error('HTTP error (503)'));
        mocks.fetchCollectionNfts.mockResolvedValue({
            kind: 'loaded',
            nfts: MAINNET_NFT_ACCOUNTS,
            undecodableCount: 0,
        });
        renderGrid();

        await screen.findByText('Failed to load NFTs');
        fireEvent.click(screen.getAllByText('Try Again')[0]);

        expect(await screen.findAllByRole('link', { name: 'Loading...' })).toHaveLength(MAINNET_NFT_ACCOUNTS.length);
        expect(mocks.fetchCollectionNfts).toHaveBeenCalledTimes(2);
    });
});

function renderGrid() {
    return render(<NftokenCollectionGrid collection={COLLECTION} />, { wrapper: Providers });
}

function Providers({ children }: { children: ReactNode }) {
    return (
        <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map(), shouldRetryOnError: false }}>
            <VisibilityProvider>{children}</VisibilityProvider>
        </SWRConfig>
    );
}

function showTile(index: number) {
    intersect([...observed.keys()][index], true);
}

function intersect(target: Element | undefined, isIntersecting: boolean) {
    const callback = target && observed.get(target);
    if (!target || !callback) throw new Error('the tile is not observed');

    act(() => {
        callback([{ isIntersecting, target } as IntersectionObserverEntry], {} as IntersectionObserver);
    });
}
