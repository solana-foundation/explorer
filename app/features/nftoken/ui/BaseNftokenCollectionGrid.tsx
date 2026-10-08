import { RefreshButton } from '@components/shared/ui/refresh-button';
import { pluralWord } from '@utils/index';
import { Children, type ReactElement } from 'react';

import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';

export function BaseNftokenCollectionGrid({
    onRefresh,
    refreshing,
    tiles,
    undecodableCount,
}: {
    onRefresh: () => void;
    refreshing: boolean;
    tiles: ReactElement[];
    undecodableCount: number;
}) {
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    NFTs
                </CardTitle>
                <RefreshButton analyticsSection="nft_token_collection_grid" fetching={refreshing} onClick={onRefresh} />
            </CardHeader>

            <div className="flex flex-col gap-6 py-6">
                {tiles.length > 0 && (
                    <ul
                        aria-label="NFTs"
                        className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-6 p-0"
                    >
                        {Children.map(tiles, tile => (
                            <li>{tile}</li>
                        ))}
                    </ul>
                )}
                {tiles.length === 0 && undecodableCount === 0 && <div className="px-6">No NFTs Found</div>}
                {undecodableCount > 0 && (
                    <div className="px-6">
                        {`${undecodableCount} NFT ${pluralWord(undecodableCount, 'account')} in this collection could not be decoded.`}
                    </div>
                )}
            </div>
        </Card>
    );
}
