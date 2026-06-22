import { InfoTooltip } from '@components/common/InfoTooltip';
import { LoadingArtPlaceholder } from '@components/common/LoadingArtPlaceholder';
import { NFTImageContent } from '@components/common/NFTArt';
import { Account } from '@providers/accounts';
import React, { Suspense } from 'react';

import { Badge } from '@/app/components/shared/ui/badge';

import { parseNFTokenCollectionAccount, parseNFTokenNFTAccount } from './isNFTokenAccount';
import { useNftokenMetadata } from './nftoken-hooks';
import { NftokenTypes } from './nftoken-types';

export function NFTokenAccountHeader({ account }: { account: Account }) {
    const nft = parseNFTokenNFTAccount(account);

    if (nft) {
        return (
            <Suspense fallback={<LoadingArtPlaceholder />}>
                <NFTokenNFTHeader nft={nft} />
            </Suspense>
        );
    }

    const collection = parseNFTokenCollectionAccount(account);
    if (collection) {
        return (
            <Suspense fallback={<LoadingArtPlaceholder />}>
                <NFTokenCollectionHeader collection={collection} />
            </Suspense>
        );
    }

    return (
        <>
            <h6 className="uppercase tracking-[0.08em] text-dk-gray-700">Details</h6>
            <h2 className="mb-0">Account</h2>
        </>
    );
}

export function NFTokenNFTHeader({ nft }: { nft: NftokenTypes.NftAccount }) {
    const { data: metadata } = useNftokenMetadata(nft.metadata_url);

    return (
        <div className="-mx-3 flex flex-wrap">
            <div className="ml-1.5 flex flex-none items-center px-3">
                <NFTImageContent uri={metadata?.image.trim()} />
            </div>

            <div className="mb-3 mt-3 min-w-0 flex-1 px-3">
                {<h6 className="ml-[3px] uppercase tracking-[0.08em] text-dk-gray-700">NFToken NFT</h6>}
                <div className="flex items-center">
                    <h2 className="mb-0 ml-[3px] items-center overflow-hidden text-ellipsis whitespace-nowrap">
                        {metadata ? metadata.name || 'No NFT name was found' : 'Loading...'}
                    </h2>
                </div>

                <div>
                    <div className="mt-1.5 inline-flex items-center">
                        <Badge ui="dashkit" variant="dark" tone="solid">
                            {nft.authority_can_update ? 'Mutable' : 'Immutable'}
                        </Badge>

                        <InfoTooltip
                            bottom
                            text={
                                nft.authority_can_update
                                    ? 'The authority of this NFT can update the Metadata.'
                                    : 'The Metadata cannot be updated by anyone.'
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function NFTokenCollectionHeader({ collection }: { collection: NftokenTypes.CollectionAccount }) {
    const { data: metadata } = useNftokenMetadata(collection.metadata_url);

    return (
        <div className="-mx-3 flex flex-wrap">
            <div className="ml-1.5 flex flex-none items-center px-3">
                <NFTImageContent uri={metadata?.image} />
            </div>

            <div className="mb-3 mt-3 min-w-0 flex-1 px-3">
                {<h6 className="ml-[3px] uppercase tracking-[0.08em] text-dk-gray-700">NFToken Collection</h6>}
                <div className="flex items-center">
                    <h2 className="mb-0 ml-[3px] items-center overflow-hidden text-ellipsis whitespace-nowrap">
                        {metadata ? metadata.name || 'No collection name was found' : 'Loading...'}
                    </h2>
                </div>

                <div>
                    <div className="mt-1.5 inline-flex items-center">
                        <Badge ui="dashkit" variant="dark" tone="solid">
                            {collection.authority_can_update ? 'Mutable' : 'Immutable'}
                        </Badge>

                        <InfoTooltip
                            bottom
                            text={
                                collection.authority_can_update
                                    ? 'The authority of this Collection can update the Metadata and add NFTs.'
                                    : 'The Metadata cannot be updated by anyone.'
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
