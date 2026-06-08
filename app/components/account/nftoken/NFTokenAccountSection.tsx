import { Address } from '@components/common/Address';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { cn } from '@shared/utils';
import { PublicKey } from '@solana/web3.js';
import { Suspense, useState } from 'react';

import { getProxiedUri } from '@/app/features/metadata/utils';
import { BaseTable } from '@/app/shared/ui/Table';

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

    return (
        <AccountCard
            title="Overview"
            account={account}
            refresh={() => fetchInfo(new PublicKey(nft.address), 'parsed')}
            analyticsSection="nft_token_card"
        >
            <BaseTable.Row>
                <BaseTable.Cell>Address</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={new PublicKey(nft.address)} alignRight raw />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Authority</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={new PublicKey(nft.authority)} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Holder</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={new PublicKey(nft.holder)} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Delegate</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    {nft.delegate ? <Address pubkey={new PublicKey(nft.delegate)} alignRight link /> : 'Not Delegated'}
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Collection</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    {nft.collection ? (
                        <Address pubkey={new PublicKey(nft.collection)} alignRight link />
                    ) : (
                        'No Collection'
                    )}
                </BaseTable.Cell>
            </BaseTable.Row>
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
            <div className={cn('mx-auto e-rounded-dk', isLoading ? 'e-hidden' : 'e-block')}>
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

    return (
        <AccountCard
            title="Overview"
            account={account}
            refresh={() => fetchInfo(new PublicKey(collection.address), 'parsed')}
            analyticsSection="nft_token_collection_card"
        >
            <BaseTable.Row>
                <BaseTable.Cell>Address</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={new PublicKey(collection.address)} alignRight raw />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Authority</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={new PublicKey(collection.authority)} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Number of NFTs</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Suspense fallback={<div>Loading...</div>}>
                        <NumNfts collection={collection.address} />
                    </Suspense>
                </BaseTable.Cell>
            </BaseTable.Row>
        </AccountCard>
    );
};

const NumNfts = ({ collection }: { collection: string }) => {
    const { data: nfts } = useCollectionNfts({ collectionAddress: collection });
    return <div>{nfts.length}</div>;
};
