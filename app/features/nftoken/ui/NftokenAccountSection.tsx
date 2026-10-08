'use client';

import { UnknownAccountCard } from '@components/account/UnknownAccountCard';
import { AccountAddressRow } from '@components/common/Account';
import { KitAddress } from '@components/common/KitAddress';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import type { Account } from '@providers/accounts';
import type { Address } from '@solana/kit';

import { BaseTable } from '@/app/shared/ui/Table';

import { type NftokenCollectionAccount, type NftokenNftAccount, parseNftokenAccount } from '../lib/nftoken-accounts';
import { type CollectionNftsState, useCollectionNfts } from '../model/use-collection-nfts';

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

    return (
        <AccountCard
            title="Overview"
            account={account}
            refresh={() => refreshAccount(account.pubkey, 'parsed')}
            analyticsSection="nft_token_card"
        >
            <AccountAddressRow account={account} />
            <AddressRow address={nft.authority} label="Authority" />
            <AddressRow address={nft.holder} label="Holder" />
            <AddressRow address={nft.delegate} label="Delegate" missing="Not Delegated" />
            <AddressRow address={nft.collection} label="Collection" missing="No Collection" />
        </AccountCard>
    );
}

function CollectionCard({ account, collection }: { account: Account; collection: NftokenCollectionAccount }) {
    const refreshAccount = useRefreshAccount();
    const nfts = useCollectionNfts(collection.address);
    const refresh = () => {
        refreshAccount(account.pubkey, 'parsed');
        nfts.refresh();
    };

    return (
        <AccountCard title="Overview" account={account} refresh={refresh} analyticsSection="nft_token_collection_card">
            <AccountAddressRow account={account} />
            <AddressRow address={collection.authority} label="Authority" />
            <BaseTable.Row>
                <BaseTable.Cell>Number of NFTs</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <NftCount nfts={nfts} />
                </BaseTable.Cell>
            </BaseTable.Row>
        </AccountCard>
    );
}

function AddressRow({ address, label, missing }: { address: Address | undefined; label: string; missing?: string }) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell>{label}</BaseTable.Cell>
            <BaseTable.Cell className="text-right">
                {address ? <KitAddress address={address} alignRight link /> : missing}
            </BaseTable.Cell>
        </BaseTable.Row>
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
