import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { createRef, Suspense } from 'react';
import { ChevronDown, ExternalLink } from 'react-feather';
import useAsyncEffect from 'use-async-effect';

import { getProxiedUri } from '@/app/features/metadata';
import { useCluster } from '@/app/providers/cluster';
import { CompressedNft, useCompressedNft, useMetadataJsonLink } from '@/app/providers/compressed-nft';

import { Address } from '../common/Address';
import { InfoTooltip } from '../common/InfoTooltip';
import { LoadingArtPlaceholder } from '../common/LoadingArtPlaceholder';
import { NFTImageContent } from '../common/NFTArt';
import { getCreatorDropdownItems, getIsMutablePill, getVerifiedCollectionPill } from './MetaplexNFTHeader';
import { UnknownAccountCard } from './UnknownAccountCard';

export function CompressedNftCard({ account }: { account: Account }) {
    const { url } = useCluster();
    const compressedNft = useCompressedNft({ address: account.pubkey.toString(), url });
    if (!compressedNft) return <UnknownAccountCard account={account} />;

    const collectionGroup = compressedNft.grouping.find(group => group.group_key === 'collection');
    const updateAuthority = compressedNft.authorities.find(authority => authority.scopes.includes('full'))?.address;

    return (
        <AccountCard title="Overview" account={account}>
            <tr>
                <td>Address</td>
                <td className="e-text-right">
                    <Address pubkey={account.pubkey} alignRight raw />
                </td>
            </tr>
            <tr>
                <td>Owner</td>
                <td className="e-text-right">
                    <Address pubkey={new PublicKey(compressedNft.ownership.owner)} alignRight link />
                </td>
            </tr>
            <tr>
                <td>Verified Collection Address</td>
                <td className="e-text-right">
                    {collectionGroup ? (
                        <Address pubkey={new PublicKey(collectionGroup.group_value)} alignRight link />
                    ) : (
                        'None'
                    )}
                </td>
            </tr>
            <tr>
                <td>Update Authority</td>
                <td className="e-text-right">
                    {updateAuthority ? <Address pubkey={new PublicKey(updateAuthority)} alignRight link /> : 'None'}
                </td>
            </tr>
            <tr>
                <td>Website</td>
                <td className="e-text-right">
                    <a rel="noopener noreferrer" target="_blank" href={compressedNft.content.links.external_url}>
                        {compressedNft.content.links.external_url}
                        <ExternalLink className="align-text-top e-ml-1.5" size={13} />
                    </a>
                </td>
            </tr>
            <tr>
                <td>Seller Fee</td>
                <td className="e-text-right">{`${compressedNft.royalty.basis_points / 100}%`}</td>
            </tr>
        </AccountCard>
    );
}

export function CompressedNftAccountHeader({ account, fallback }: { account: Account; fallback?: React.ReactElement }) {
    const { url } = useCluster();
    const compressedNft = useCompressedNft({ address: account.pubkey.toString(), url });

    if (compressedNft) {
        return (
            <Suspense fallback={<LoadingArtPlaceholder />}>
                <CompressedNFTHeader compressedNft={compressedNft} />
            </Suspense>
        );
    }
    return fallback || <div />;
}

export function CompressedNFTHeader({ compressedNft }: { compressedNft: CompressedNft }) {
    // Empty strings are possible, so the check is necessary.
    const proxiedURI = compressedNft.content.json_uri ? getProxiedUri(compressedNft.content.json_uri) : null;
    const metadataJson = useMetadataJsonLink(proxiedURI);
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
        <div className="row">
            <div className="col-auto e-ml-1.5 e-flex e-items-center">
                <NFTImageContent uri={metadataJson?.image} />
            </div>
            <div className="col ms-0.5 e-mb-3 e-mt-3">
                {<h6 className="header-pretitle e-ml-[3px]">Metaplex Compressed NFT</h6>}
                <div className="e-flex e-items-center">
                    <h2 className="header-title no-overflow-with-ellipsis e-ml-[3px] e-items-center">
                        {compressedNft.content.metadata.name !== ''
                            ? compressedNft.content.metadata.name
                            : 'No NFT name was found'}
                    </h2>
                    {getVerifiedCollectionPill()}
                </div>
                <h4 className="header-pretitle no-overflow-with-ellipsis e-ml-[3px] e-mt-[3px]">
                    {compressedNft.content.metadata.symbol !== ''
                        ? compressedNft.content.metadata.symbol
                        : 'No Symbol was found'}
                </h4>
                <div className="e-mb-1.5 e-mt-1.5">{getCompressedNftPill()}</div>
                <div className="e-mb-3 e-mt-1.5">{getIsMutablePill(compressedNft.mutable)}</div>
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
                    <div className="dropdown-menu e-mt-1.5">{getCreatorDropdownItems(compressedNft.creators)}</div>
                </div>
            </div>
        </div>
    );
}

function getCompressedNftPill() {
    const onchainVerifiedToolTip =
        'This NFT does not have a corresponding account, but uses verified ledger data to allow for transfers and trades. The existence of this tag ensures that the compressed NFT is verifiably up-to-date with the chain.';
    return (
        <div className="d-inline-flex e-ml-1.5 e-items-center">
            <span className="badge badge-pill bg-dark">{'Compressed'}</span>
            <InfoTooltip bottom text={onchainVerifiedToolTip} />
        </div>
    );
}
