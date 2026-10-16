import { Address } from '@components/common/Address';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { Suspense } from 'react';

import { ProxiedImage } from '@/app/features/metadata';
import { type KeyValueRow, KeyValueRows } from '@/app/shared/ui/key-value';

import { UnknownAccountCard } from '../UnknownAccountCard';
import { parseNFTokenCollectionAccount, parseNFTokenNFTAccount } from './isNFTokenAccount';
import { useCollectionNfts } from './nftoken-hooks';
import { NftokenTypes } from './nftoken-types';

export function NFTokenAccountSection({ account }: { account: Account }) {
    const nft = parseNFTokenNFTAccount(account);
    if (nft) {
        return <NFTCard account={account} nft={nft} />;
    }

    const collection = parseNFTokenCollectionAccount(account);
    if (collection) {
        return <CollectionCard account={account} collection={collection} />;
    }

    return <UnknownAccountCard account={account} />;
}

const NFTCard = ({ account, nft }: { account: Account; nft: NftokenTypes.NftAccount }) => {
    const fetchInfo = useRefreshAccount();

    const rows: KeyValueRow[] = [
        { label: 'Address', value: <Address pubkey={new PublicKey(nft.address)} raw /> },
        { label: 'Authority', value: <Address pubkey={new PublicKey(nft.authority)} link /> },
        { label: 'Holder', value: <Address pubkey={new PublicKey(nft.holder)} link /> },
        {
            label: 'Delegate',
            value: nft.delegate ? <Address pubkey={new PublicKey(nft.delegate)} link /> : 'Not Delegated',
        },
        {
            label: 'Collection',
            value: nft.collection ? <Address pubkey={new PublicKey(nft.collection)} link /> : 'No Collection',
        },
    ];

    return (
        <AccountCard
            title="Overview"
            account={account}
            refresh={() => fetchInfo(new PublicKey(nft.address), 'parsed')}
            analyticsSection="nft_token_card"
        >
            <KeyValueRows rows={rows} />
        </AccountCard>
    );
};

export const NftokenImage = ({ url, size }: { url: string | undefined; size: number }) => {
    // ProxiedImage owns the whole lifecycle — a skeleton while loading, the image
    // on success, and a logo + reason + "View original" link on failure — so there
    // is no need for a separate loading box or visibility toggling here.
    return (
        <div className="mx-auto rounded-dk">
            <ProxiedImage alt="nft" height={size} showOriginalLink uri={url} width={size} />
        </div>
    );
};

const CollectionCard = ({ account, collection }: { account: Account; collection: NftokenTypes.CollectionAccount }) => {
    const fetchInfo = useRefreshAccount();

    const rows: KeyValueRow[] = [
        { label: 'Address', value: <Address pubkey={new PublicKey(collection.address)} raw /> },
        { label: 'Authority', value: <Address pubkey={new PublicKey(collection.authority)} link /> },
        {
            label: 'Number of NFTs',
            value: (
                <Suspense fallback={<div>Loading...</div>}>
                    <NumNfts collection={collection.address} />
                </Suspense>
            ),
        },
    ];

    return (
        <AccountCard
            title="Overview"
            account={account}
            refresh={() => fetchInfo(new PublicKey(collection.address), 'parsed')}
            analyticsSection="nft_token_collection_card"
        >
            <KeyValueRows rows={rows} />
        </AccountCard>
    );
};

const NumNfts = ({ collection }: { collection: string }) => {
    const { data: nfts } = useCollectionNfts({ collectionAddress: collection });
    return <div>{nfts.length}</div>;
};
