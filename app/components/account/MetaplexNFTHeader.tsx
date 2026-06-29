import { InfoTooltip } from '@components/common/InfoTooltip';
import { NFTImageContent } from '@components/common/NFTArt';
import type { EditionInfo } from '@entities/nft';
import { isSome } from '@metaplex-foundation/umi';
import { NFTData, useFetchAccountInfo, useMintAccountInfo } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import React from 'react';
import { AlertOctagon, Check, ChevronDown } from 'react-feather';

import { Badge } from '@/app/components/shared/ui/badge';
import { Button } from '@/app/components/shared/ui/button';
import {
    Dropdown,
    DropdownHeader,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
} from '@/app/components/shared/ui/dropdown';

export function MetaplexNFTHeader({ nftData }: { nftData: NFTData }) {
    const collectionOpt = nftData.metadata.collection;
    const collection = collectionOpt && isSome(collectionOpt) ? collectionOpt.value : null;
    const collectionAddress = collection?.key;
    const collectionMintInfo = useMintAccountInfo(collectionAddress?.toString());
    const fetchAccountInfo = useFetchAccountInfo();

    React.useEffect(() => {
        if (collectionAddress && !collectionMintInfo) {
            fetchAccountInfo(new PublicKey(collectionAddress.toString()), 'parsed');
        }
    }, [fetchAccountInfo, collectionAddress]); // eslint-disable-line react-hooks/exhaustive-deps

    const metadata = nftData.metadata;
    const data = nftData.json;
    const isVerifiedCollection = collection != null && collection?.verified && collectionMintInfo !== undefined;
    return (
        <div className="-mx-3 flex flex-wrap">
            <div className="ml-1.5 flex flex-none items-center px-3">
                <NFTImageContent uri={data?.image} />
            </div>
            <div className="mb-3 mt-3 min-w-0 flex-1 px-3">
                {<h6 className="ml-[3px] uppercase tracking-[0.08em] text-dk-gray-700">Metaplex NFT</h6>}
                <div className="flex items-center">
                    <h2 className="mb-0 ml-[3px] items-center overflow-hidden text-ellipsis whitespace-nowrap">
                        {metadata.name !== '' ? metadata.name : 'No NFT name was found'}
                    </h2>
                    {getEditionPill(nftData.editionInfo)}
                    {isVerifiedCollection ? getVerifiedCollectionPill() : null}
                </div>
                <h4 className="ml-[3px] mt-[3px] overflow-hidden text-ellipsis whitespace-nowrap uppercase tracking-[0.08em] text-dk-gray-700">
                    {metadata.symbol !== '' ? metadata.symbol : 'No Symbol was found'}
                </h4>
                <div className="mb-1.5 mt-1.5">{getSaleTypePill(metadata.primarySaleHappened)}</div>
                <div className="mb-3 mt-1.5">{getIsMutablePill(metadata.isMutable)}</div>
                <Dropdown className="inline-flex">
                    <DropdownToggle asChild>
                        <Button ui="dashkit" variant="dark" size="sm" className="w-[150px]" type="button">
                            Creators <ChevronDown size={15} className="align-text-top" />
                        </Button>
                    </DropdownToggle>
                    <DropdownMenu className="mt-1.5">
                        {getCreatorDropdownItems(isSome(metadata.creators) ? metadata.creators.value : null)}
                    </DropdownMenu>
                </Dropdown>
            </div>
        </div>
    );
}

export function getCreatorDropdownItems(creators: Array<{ address: string; verified: boolean; share: number }> | null) {
    const CreatorHeader = () => {
        const creatorTooltip = 'Verified creators signed the metadata associated with this NFT when it was created.';

        const shareTooltip = 'The percentage of the proceeds a creator receives when this NFT is sold.';

        return (
            <DropdownHeader className="flex flex-wrap items-center">
                <div className="flex max-w-[80%] grow-0 basis-[80%] font-mono">
                    <span>Creator Address</span>
                    <InfoTooltip bottom text={creatorTooltip} />
                </div>
                <div className="flex font-mono">
                    <span className="font-mono">Royalty</span>
                    <InfoTooltip bottom text={shareTooltip} />
                </div>
            </DropdownHeader>
        );
    };

    const getVerifiedIcon = (isVerified: boolean) => {
        return isVerified ? <Check className="ml-3" size={15} /> : <AlertOctagon className="mr-3" size={15} />;
    };

    const CreatorEntry = (creator: { address: string; verified: boolean; share: number }) => {
        const creatorPath = useClusterPath({ pathname: `/address/${creator.address}` });
        return (
            <div className="ml-3 mr-3 flex flex-wrap items-center font-mono">
                {getVerifiedIcon(creator.verified)}
                <DropdownItem
                    asChild
                    className="max-w-[80%] grow-0 basis-[80%] overflow-hidden text-ellipsis font-mono"
                >
                    <Link href={creatorPath}>{creator.address}</Link>
                </DropdownItem>
                <div className="mr-3"> {`${creator.share}%`}</div>
            </div>
        );
    };

    if (creators && creators.length > 0) {
        const listOfCreators: JSX.Element[] = [];

        listOfCreators.push(<CreatorHeader key={'header'} />);
        creators.forEach(creator => {
            listOfCreators.push(<CreatorEntry key={creator.address} {...creator} />);
        });

        return listOfCreators;
    }

    return (
        <DropdownItem className="font-mono">
            <div className="mr-3">No creators are associated with this NFT.</div>
        </DropdownItem>
    );
}

function getEditionPill(editionInfo: EditionInfo) {
    const masterEdition = editionInfo.masterEdition;
    const edition = editionInfo.edition;

    return (
        <div className="ml-1.5 inline-flex">
            <Badge ui="dashkit" variant="dark" tone="solid">
                {edition && masterEdition
                    ? `Edition ${Number(edition.edition)} / ${Number(masterEdition.supply)}`
                    : masterEdition
                      ? 'Master Edition'
                      : 'No Master Edition Information'}
            </Badge>
        </div>
    );
}

function getSaleTypePill(hasPrimarySaleHappened: boolean) {
    const primaryMarketTooltip = 'Creator(s) split 100% of the proceeds when this NFT is sold.';

    const secondaryMarketTooltip =
        'Creator(s) split the Seller Fee when this NFT is sold. The owner receives the remaining proceeds.';

    return (
        <div className="inline-flex items-center">
            <Badge ui="dashkit" variant="dark" tone="solid">
                {hasPrimarySaleHappened ? 'Secondary Market' : 'Primary Market'}
            </Badge>
            <InfoTooltip bottom text={hasPrimarySaleHappened ? secondaryMarketTooltip : primaryMarketTooltip} />
        </div>
    );
}

export function getIsMutablePill(isMutable: boolean) {
    return (
        <Badge ui="dashkit" variant="dark" tone="solid">
            {isMutable ? 'Mutable' : 'Immutable'}
        </Badge>
    );
}

export function getVerifiedCollectionPill() {
    const onchainVerifiedToolTip =
        'This NFT has been verified as a member of an on-chain collection. This tag guarantees authenticity.';
    return (
        <div className="ml-1.5 inline-flex items-center">
            <Badge ui="dashkit" variant="dark" tone="solid">
                Verified Collection
            </Badge>
            <InfoTooltip bottom text={onchainVerifiedToolTip} />
        </div>
    );
}
