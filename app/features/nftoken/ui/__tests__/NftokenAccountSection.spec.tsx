import type { Account } from '@providers/accounts';
import type { PublicKey } from '@solana/web3.js';
import { act, render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    accountBytes,
    COLLECTION,
    COLLECTION_FIELD,
    collectionAccount,
    MAINNET_AUTHORITY,
    MAINNET_NFT_ACCOUNTS,
    MAINNET_NFTS,
    nftokenAccount,
} from '../../__tests__/fixtures';
import { NftokenAccountSection } from '../NftokenAccountSection';

const mocks = vi.hoisted(() => ({ fetchCollectionNfts: vi.fn() }));

vi.mock('@entities/cluster', () => ({ useCluster: () => ({ connectableUrl: 'https://mock.rpc' }) }));
vi.mock('@entities/account', () => ({ useRefreshAccount: () => vi.fn() }));
vi.mock('@features/account', () => ({
    AccountCard: ({ children }: { children: ReactNode }) => (
        <table>
            <tbody>{children}</tbody>
        </table>
    ),
}));
vi.mock('@components/account/UnknownAccountCard', () => ({ UnknownAccountCard: () => <p>UnknownAccountCard</p> }));
vi.mock('@components/common/Address', () => ({
    Address: ({ pubkey }: { pubkey: PublicKey }) => <span>{pubkey.toBase58()}</span>,
}));
vi.mock('../../api/fetch-collection-nfts', () => ({ fetchCollectionNfts: mocks.fetchCollectionNfts }));

const [NFT] = MAINNET_NFTS;

afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
});

describe('NftokenAccountSection', () => {
    it('should show each address of an NFT in its own row', () => {
        renderSection(nftokenAccount(accountBytes(NFT.base64), NFT.pubkey));

        expect(screen.getByRole('row', { name: `Address ${NFT.pubkey}` })).toBeInTheDocument();
        expect(screen.getByRole('row', { name: `Authority ${MAINNET_AUTHORITY}` })).toBeInTheDocument();
        expect(screen.getByRole('row', { name: `Holder ${NFT.holder}` })).toBeInTheDocument();
        expect(screen.getByRole('row', { name: 'Delegate Not Delegated' })).toBeInTheDocument();
        expect(screen.getByRole('row', { name: `Collection ${COLLECTION}` })).toBeInTheDocument();
    });

    it('should show No Collection for an NFT without a collection', () => {
        const data = accountBytes(NFT.base64);
        data.fill(0, COLLECTION_FIELD.start, COLLECTION_FIELD.end);

        renderSection(nftokenAccount(data, NFT.pubkey));

        expect(screen.getByRole('row', { name: 'Collection No Collection' })).toBeInTheDocument();
    });

    it('should show the authority of a collection', () => {
        mocks.fetchCollectionNfts.mockResolvedValue({
            kind: 'loaded',
            nfts: MAINNET_NFT_ACCOUNTS,
            undecodableCount: 0,
        });

        renderSection(collectionAccount());

        expect(screen.getByRole('row', { name: `Address ${COLLECTION}` })).toBeInTheDocument();
        expect(screen.getByRole('row', { name: `Authority ${MAINNET_AUTHORITY}` })).toBeInTheDocument();
    });

    it('should count every NFT account in a collection, including the ones that do not decode', async () => {
        mocks.fetchCollectionNfts.mockResolvedValue({
            kind: 'loaded',
            nfts: MAINNET_NFT_ACCOUNTS,
            undecodableCount: 2,
        });

        renderSection(collectionAccount());

        expect(
            await screen.findByRole('row', { name: `Number of NFTs ${MAINNET_NFT_ACCOUNTS.length + 2}` }),
        ).toBeInTheDocument();
    });

    it('should show Loading... as the count while the request is pending', () => {
        mocks.fetchCollectionNfts.mockReturnValue(new Promise(() => {}));

        renderSection(collectionAccount());

        expect(screen.getByRole('row', { name: 'Number of NFTs Loading...' })).toBeInTheDocument();
    });

    it.each([
        ['unsupported', () => mocks.fetchCollectionNfts.mockResolvedValue({ kind: 'unsupported' })],
        ['refused', () => mocks.fetchCollectionNfts.mockResolvedValue({ kind: 'refused' })],
        ['failed', () => mocks.fetchCollectionNfts.mockRejectedValue(new Error('HTTP error (503)'))],
    ])('should show Fetch Failed as the count when the request is %s', async (_, arrange) => {
        arrange();

        renderSection(collectionAccount());

        expect(await screen.findByRole('row', { name: 'Number of NFTs Fetch Failed' })).toBeInTheDocument();
    });

    it('should stop requesting the NFTs after two retries', async () => {
        vi.useFakeTimers();
        mocks.fetchCollectionNfts.mockRejectedValue(new Error('HTTP error (503)'));

        renderSection(collectionAccount());
        await act(() => vi.advanceTimersByTimeAsync(10 * 60_000));

        expect(mocks.fetchCollectionNfts).toHaveBeenCalledTimes(3);
        expect(screen.getByRole('row', { name: 'Number of NFTs Fetch Failed' })).toBeInTheDocument();
    });

    it('should render the unknown account card for data that does not decode', () => {
        renderSection(nftokenAccount(new Uint8Array(188), NFT.pubkey));

        expect(screen.getByText('UnknownAccountCard')).toBeInTheDocument();
        expect(mocks.fetchCollectionNfts).not.toHaveBeenCalled();
    });
});

function renderSection(account: Account) {
    return render(<NftokenAccountSection account={account} />, { wrapper: Providers });
}

function Providers({ children }: { children: ReactNode }) {
    return <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>{children}</SWRConfig>;
}
