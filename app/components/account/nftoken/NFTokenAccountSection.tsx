import { Address } from '@components/common/Address';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { cn } from '@shared/utils';
import { PublicKey } from '@solana/web3.js';
import { Suspense, useState } from 'react';

import { getProxiedUri } from '@/app/features/metadata/utils';
import { refreshAnalytics } from '@/app/shared/lib/analytics';

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
    const refresh = () => {
        refreshAnalytics.trackButtonClicked('nft_token_card');
        fetchInfo(new PublicKey(nft.address), 'parsed');
    };

    return (
        <AccountCard title="Overview" account={account} refresh={refresh}>
            <tr>
                <td>Address</td>
                <td className="text-lg-end">
                    <Address pubkey={new PublicKey(nft.address)} alignRight raw />
                </td>
            </tr>
            <tr>
                <td>Authority</td>
                <td className="text-lg-end">
                    <Address pubkey={new PublicKey(nft.authority)} alignRight link />
                </td>
            </tr>
            <tr>
                <td>Holder</td>
                <td className="text-lg-end">
                    <Address pubkey={new PublicKey(nft.holder)} alignRight link />
                </td>
            </tr>
            <tr>
                <td>Delegate</td>
                <td className="text-lg-end">
                    {nft.delegate ? <Address pubkey={new PublicKey(nft.delegate)} alignRight link /> : 'Not Delegated'}
                </td>
            </tr>
            <tr>
                <td>Collection</td>
                <td className="text-lg-end">
                    {nft.collection ? (
                        <Address pubkey={new PublicKey(nft.collection)} alignRight link />
                    ) : (
                        'No Collection'
                    )}
                </td>
            </tr>
        </AccountCard>
    );
};

export const NftokenImage = ({ url, size }: { url: string | undefined; size: number }) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);

    return (
        <>
            {isLoading && (
                <div
                    style={{
                        backgroundColor: 'lightgrey',
                        height: size,
                        width: size,
                    }}
                />
            )}
            <div className={cn('rounded mx-auto', isLoading ? 'd-none' : 'd-block')}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    alt="nft"
                    height={size}
                    onLoad={() => {
                        setIsLoading(false);
                    }}
                    src={url ? getProxiedUri(url) : url}
                    width={size}
                />
            </div>
        </>
    );
};

const CollectionCard = ({ account, collection }: { account: Account; collection: NftokenTypes.CollectionAccount }) => {
    const fetchInfo = useRefreshAccount();
    const refresh = () => {
        refreshAnalytics.trackButtonClicked('nft_token_collection_card');
        fetchInfo(new PublicKey(collection.address), 'parsed');
    };

    return (
        <AccountCard title="Overview" account={account} refresh={refresh}>
            <tr>
                <td>Address</td>
                <td className="text-lg-end">
                    <Address pubkey={new PublicKey(collection.address)} alignRight raw />
                </td>
            </tr>
            <tr>
                <td>Authority</td>
                <td className="text-lg-end">
                    <Address pubkey={new PublicKey(collection.authority)} alignRight link />
                </td>
            </tr>
            <tr>
                <td>Number of NFTs</td>
                <td className="text-lg-end">
                    <Suspense fallback={<div>Loading...</div>}>
                        <NumNfts collection={collection.address} />
                    </Suspense>
                </td>
            </tr>
        </AccountCard>
    );
};

const NumNfts = ({ collection }: { collection: string }) => {
    const { data: nfts } = useCollectionNfts({ collectionAddress: collection });
    return <div>{nfts.length}</div>;
};
