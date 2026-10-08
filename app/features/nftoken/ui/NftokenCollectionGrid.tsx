'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { useClusterPath } from '@entities/cluster';
import type { Address } from '@solana/kit';
import type { ReactElement } from 'react';

import { useVisibility } from '@/app/shared/lib/visibility';

import type { NftokenNftAccount } from '../lib/nftoken-accounts';
import { useCollectionNfts } from '../model/use-collection-nfts';
import { useNftokenMetadata, useRefreshNftokenMetadata } from '../model/use-nftoken-metadata';
import { BaseNftokenCollectionGrid } from './BaseNftokenCollectionGrid';
import { BaseNftokenTile } from './BaseNftokenTile';

export function NftokenCollectionGrid({ collection }: { collection: Address }): ReactElement {
    const nfts = useCollectionNfts(collection);
    const refreshMetadata = useRefreshNftokenMetadata();
    const refresh = () => {
        nfts.refresh();
        refreshMetadata();
    };

    switch (nfts.kind) {
        case 'loading':
            return <LoadingCard />;
        case 'unsupported':
            return <ErrorCard text="This RPC endpoint does not support getProgramAccounts" />;
        case 'refused':
            return <ErrorCard text="This RPC endpoint refused to list NFTs" />;
        case 'failed':
            return <ErrorCard retry={nfts.refresh} text="Failed to load NFTs" />;
        case 'loaded':
            return (
                <BaseNftokenCollectionGrid
                    onRefresh={refresh}
                    refreshing={nfts.refreshing}
                    tiles={nfts.nfts.map(nft => (
                        <NftokenTile key={nft.address} nft={nft} />
                    ))}
                    undecodableCount={nfts.undecodableCount}
                />
            );
    }
}

function NftokenTile({ nft }: { nft: NftokenNftAccount }) {
    const { isVisible, ref } = useVisibility<HTMLDivElement>(true);
    const metadata = useNftokenMetadata(isVisible ? nft.metadata_url : undefined);
    const href = useClusterPath({ pathname: `/address/${nft.address}` });

    return <BaseNftokenTile href={href} metadata={metadata} ref={ref} />;
}
