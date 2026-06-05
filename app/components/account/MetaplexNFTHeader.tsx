import { InfoTooltip } from '@components/common/InfoTooltip';
import { NFTImageContent } from '@components/common/NFTArt';
import type { EditionInfo } from '@entities/nft';
import { isSome } from '@metaplex-foundation/umi';
import { NFTData, useFetchAccountInfo, useMintAccountInfo } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import React, { createRef } from 'react';
import { AlertOctagon, Check, ChevronDown } from 'react-feather';
import useAsyncEffect from 'use-async-effect';

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
    const dropdownRef = createRef<HTMLButtonElement>();
    useAsyncEffect(
        async isMounted => {
            if (!dropdownRef.current) {
                return;
            }
            const Dropdown = (await import('bootstrap/js/dist/dropdown')).default;
            if (!isMounted || !dropdownRef.current) {
                return;
            }
            return new Dropdown(dropdownRef.current);
        },
        dropdown => {
            if (dropdown) {
                dropdown.dispose();
            }
        },
        [dropdownRef],
    );
    return (
        <div className="-e-mx-3 e-flex e-flex-wrap">
            <div className="e-ml-1.5 e-flex e-flex-none e-items-center e-px-3">
                <NFTImageContent uri={data?.image} />
            </div>
            <div className="e-mb-3 e-mt-3 e-min-w-0 e-flex-1 e-px-3">
                {<h6 className="e-ml-[3px] e-uppercase e-tracking-[0.08em] e-text-dk-gray-700">Metaplex NFT</h6>}
                <div className="e-flex e-items-center">
                    <h2 className="e-mb-0 e-ml-[3px] e-items-center e-overflow-hidden e-text-ellipsis e-whitespace-nowrap">
                        {metadata.name !== '' ? metadata.name : 'No NFT name was found'}
                    </h2>
                    {getEditionPill(nftData.editionInfo)}
                    {isVerifiedCollection ? getVerifiedCollectionPill() : null}
                </div>
                <h4 className="e-ml-[3px] e-mt-[3px] e-overflow-hidden e-text-ellipsis e-whitespace-nowrap e-uppercase e-tracking-[0.08em] e-text-dk-gray-700">
                    {metadata.symbol !== '' ? metadata.symbol : 'No Symbol was found'}
                </h4>
                <div className="e-mb-1.5 e-mt-1.5">{getSaleTypePill(metadata.primarySaleHappened)}</div>
                <div className="e-mb-3 e-mt-1.5">{getIsMutablePill(metadata.isMutable)}</div>
                <div className="btn-group">
                    <button
                        className="btn btn-dark btn-sm creators-dropdown-button-width"
                        type="button"
                        aria-haspopup="true"
                        aria-expanded="false"
                        data-bs-toggle="dropdown"
                        ref={dropdownRef}
                    >
                        Creators <ChevronDown size={15} className="align-text-top" />
                    </button>
                    <div className="dropdown-menu e-mt-1.5">
                        {getCreatorDropdownItems(isSome(metadata.creators) ? metadata.creators.value : null)}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function getCreatorDropdownItems(creators: Array<{ address: string; verified: boolean; share: number }> | null) {
    const CreatorHeader = () => {
        const creatorTooltip = 'Verified creators signed the metadata associated with this NFT when it was created.';

        const shareTooltip = 'The percentage of the proceeds a creator receives when this NFT is sold.';

        return (
            <div className="dropdown-header creator-dropdown-entry e-flex e-items-center">
                <div className="creator-dropdown-header e-flex e-font-mono">
                    <span>Creator Address</span>
                    <InfoTooltip bottom text={creatorTooltip} />
                </div>
                <div className="e-flex e-font-mono">
                    <span className="e-font-mono">Royalty</span>
                    <InfoTooltip bottom text={shareTooltip} />
                </div>
            </div>
        );
    };

    const getVerifiedIcon = (isVerified: boolean) => {
        return isVerified ? <Check className="e-ml-3" size={15} /> : <AlertOctagon className="e-mr-3" size={15} />;
    };

    const CreatorEntry = (creator: { address: string; verified: boolean; share: number }) => {
        const creatorPath = useClusterPath({ pathname: `/address/${creator.address}` });
        return (
            <div className="creator-dropdown-entry e-ml-3 e-mr-3 e-flex e-items-center e-font-mono">
                {getVerifiedIcon(creator.verified)}
                <Link className="dropdown-item creator-dropdown-entry-address e-font-mono" href={creatorPath}>
                    {creator.address}
                </Link>
                <div className="e-mr-3"> {`${creator.share}%`}</div>
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
        <div className="dropdown-item e-font-mono">
            <div className="e-mr-3">No creators are associated with this NFT.</div>
        </div>
    );
}

function getEditionPill(editionInfo: EditionInfo) {
    const masterEdition = editionInfo.masterEdition;
    const edition = editionInfo.edition;

    return (
        <div className="e-ml-1.5 e-inline-flex">
            <span className="badge badge-pill bg-dark">{`${
                edition && masterEdition
                    ? `Edition ${Number(edition.edition)} / ${Number(masterEdition.supply)}`
                    : masterEdition
                      ? 'Master Edition'
                      : 'No Master Edition Information'
            }`}</span>
        </div>
    );
}

function getSaleTypePill(hasPrimarySaleHappened: boolean) {
    const primaryMarketTooltip = 'Creator(s) split 100% of the proceeds when this NFT is sold.';

    const secondaryMarketTooltip =
        'Creator(s) split the Seller Fee when this NFT is sold. The owner receives the remaining proceeds.';

    return (
        <div className="e-inline-flex e-items-center">
            <span className="badge badge-pill bg-dark">{`${
                hasPrimarySaleHappened ? 'Secondary Market' : 'Primary Market'
            }`}</span>
            <InfoTooltip bottom text={hasPrimarySaleHappened ? secondaryMarketTooltip : primaryMarketTooltip} />
        </div>
    );
}

export function getIsMutablePill(isMutable: boolean) {
    return <span className="badge badge-pill bg-dark">{`${isMutable ? 'Mutable' : 'Immutable'}`}</span>;
}

export function getVerifiedCollectionPill() {
    const onchainVerifiedToolTip =
        'This NFT has been verified as a member of an on-chain collection. This tag guarantees authenticity.';
    return (
        <div className="e-ml-1.5 e-inline-flex e-items-center">
            <span className="badge badge-pill bg-dark">{'Verified Collection'}</span>
            <InfoTooltip bottom text={onchainVerifiedToolTip} />
        </div>
    );
}
