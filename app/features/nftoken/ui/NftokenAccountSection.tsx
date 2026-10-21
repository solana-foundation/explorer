'use client';

import { UnknownAccountCard } from '@components/account/UnknownAccountCard';
import { AccountAddressRow } from '@components/common/Account';
import { KitAddress } from '@components/common/KitAddress';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import type { Account } from '@providers/accounts';

import { type KeyValueRow, KeyValueRows } from '@/app/shared/ui/key-value';

import { type NftokenCollectionAccount, type NftokenNftAccount, parseNftokenAccount } from '../lib/nftoken-accounts';
import { type CollectionNftsState, useCollectionNfts } from '../model/use-collection-nfts';
import { useRefreshNftokenMetadata } from '../model/use-nftoken-metadata';

export function NftokenAccountSection({ account }: { account: Account }) {
    const nftoken = parseNftokenAccount(account);

    switch (nftoken?.kind) {
        case 'nft':
            return <NftCard account={account} nft={nftoken} />;
        case 'collection':
            return <CollectionCard account={account} collection={nftoken} />;
        default:
            return <UnknownAccountCard account={account} />;
    }
}

function NftCard({ account, nft }: { account: Account; nft: NftokenNftAccount }) {
    const refreshAccount = useRefreshAccount();
    const refreshMetadata = useRefreshNftokenMetadata();
    const refresh = () => {
        refreshAccount(account.pubkey, 'parsed');
        refreshMetadata();
    };

    const rows: KeyValueRow[] = [
        { label: 'Authority', value: <KitAddress address={nft.authority} link /> },
        { label: 'Holder', value: <KitAddress address={nft.holder} link /> },
        {
            label: 'Delegate',
            value: nft.delegate ? <KitAddress address={nft.delegate} link /> : 'Not Delegated',
        },
        {
            label: 'Collection',
            value: nft.collection ? <KitAddress address={nft.collection} link /> : 'No Collection',
        },
    ];

    return (
        <AccountCard title="Overview" account={account} refresh={refresh} analyticsSection="nft_token_card">
            <AccountAddressRow account={account} />
            <KeyValueRows rows={rows} />
        </AccountCard>
    );
}

function CollectionCard({ account, collection }: { account: Account; collection: NftokenCollectionAccount }) {
    const refreshAccount = useRefreshAccount();
    const refreshMetadata = useRefreshNftokenMetadata();
    const nfts = useCollectionNfts(collection.address);
    const refresh = () => {
        refreshAccount(account.pubkey, 'parsed');
        nfts.refresh();
        refreshMetadata();
    };

    const rows: KeyValueRow[] = [
        { label: 'Authority', value: <KitAddress address={collection.authority} link /> },
        { label: 'Number of NFTs', value: <NftCount nfts={nfts} /> },
    ];

    return (
        <AccountCard title="Overview" account={account} refresh={refresh} analyticsSection="nft_token_collection_card">
            <AccountAddressRow account={account} />
            <KeyValueRows rows={rows} />
        </AccountCard>
    );
}

function NftCount({ nfts }: { nfts: CollectionNftsState }): string | number {
    switch (nfts.kind) {
        case 'loading':
            return 'Loading...';
        case 'loaded':
            return nfts.nfts.length + nfts.undecodableCount;
        case 'unsupported':
        case 'refused':
        case 'failed':
            return 'Fetch Failed';
    }
}
