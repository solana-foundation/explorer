'use client';

import { RefreshButton } from '@shared/ui/refresh-button';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import React from 'react';

import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';

import { useCollectionNfts } from './nftoken-hooks';
import { NftokenTypes } from './nftoken-types';
import { NftokenImage } from './NFTokenAccountSection';

export function NFTokenCollectionNFTGrid({ collection }: { collection: string }) {
    const { data: nfts, mutate } = useCollectionNfts({
        collectionAddress: collection,
    });
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    NFTs
                </CardTitle>

                <RefreshButton analyticsSection="nft_token_collection_grid" onClick={mutate} />
            </CardHeader>

            <div className="py-6">
                {nfts.length === 0 && <div className="px-6">No NFTs Found</div>}

                {nfts.length > 0 && (
                    <div
                        style={{
                            display: 'grid',

                            gridGap: '1.5rem',
                            /* Creates as many columns as possible that are at least 10rem wide. */
                            gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))',
                        }}
                    >
                        {nfts.map(nft => (
                            <Nft nft={nft} key={nft.address} />
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
}

function Nft({ nft }: { nft: NftokenTypes.NftInfo }) {
    const nftPath = useClusterPath({ pathname: `/address/${nft.address}` });
    return (
        <div
            style={{
                alignItems: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                justifyContent: 'center',
            }}
        >
            <NftokenImage url={nft.image} size={80} />
            <div>
                <Link href={nftPath}>
                    <div>{nft.name ?? 'No Name'}</div>
                </Link>
            </div>
        </div>
    );
}
