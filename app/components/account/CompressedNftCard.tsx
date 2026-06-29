import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { Suspense } from 'react';
import { ChevronDown, ExternalLink } from 'react-feather';

import { Badge } from '@/app/components/shared/ui/badge';
import { Button } from '@/app/components/shared/ui/button';
import { Dropdown, DropdownMenu, DropdownToggle } from '@/app/components/shared/ui/dropdown';
import { getProxiedUri } from '@/app/features/metadata';
import { useCluster } from '@/app/providers/cluster';
import { CompressedNft, useCompressedNft, useMetadataJsonLink } from '@/app/providers/compressed-nft';
import { BaseTable } from '@/app/shared/ui/Table';

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
            <BaseTable.Row>
                <BaseTable.Cell>Address</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={account.pubkey} alignRight raw />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Owner</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={new PublicKey(compressedNft.ownership.owner)} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Verified Collection Address</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    {collectionGroup ? (
                        <Address pubkey={new PublicKey(collectionGroup.group_value)} alignRight link />
                    ) : (
                        'None'
                    )}
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Update Authority</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    {updateAuthority ? <Address pubkey={new PublicKey(updateAuthority)} alignRight link /> : 'None'}
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Website</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <a rel="noopener noreferrer" target="_blank" href={compressedNft.content.links.external_url}>
                        {compressedNft.content.links.external_url}
                        <ExternalLink className="ml-1.5 align-text-top" size={13} />
                    </a>
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Seller Fee</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{`${compressedNft.royalty.basis_points / 100}%`}</BaseTable.Cell>
            </BaseTable.Row>
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

    return (
        <div className="-mx-3 flex flex-wrap">
            <div className="ml-1.5 flex flex-none items-center px-3">
                <NFTImageContent uri={metadataJson?.image} />
            </div>
            <div className="mb-3 mt-3 min-w-0 flex-1 px-3">
                {<h6 className="ml-[3px] uppercase tracking-[0.08em] text-dk-gray-700">Metaplex Compressed NFT</h6>}
                <div className="flex items-center">
                    <h2 className="mb-0 ml-[3px] items-center overflow-hidden text-ellipsis whitespace-nowrap">
                        {compressedNft.content.metadata.name !== ''
                            ? compressedNft.content.metadata.name
                            : 'No NFT name was found'}
                    </h2>
                    {getVerifiedCollectionPill()}
                </div>
                <h4 className="ml-[3px] mt-[3px] overflow-hidden text-ellipsis whitespace-nowrap uppercase tracking-[0.08em] text-dk-gray-700">
                    {compressedNft.content.metadata.symbol !== ''
                        ? compressedNft.content.metadata.symbol
                        : 'No Symbol was found'}
                </h4>
                <div className="mb-1.5 mt-1.5">{getCompressedNftPill()}</div>
                <div className="mb-3 mt-1.5">{getIsMutablePill(compressedNft.mutable)}</div>
                <Dropdown className="inline-flex">
                    <DropdownToggle asChild>
                        <Button ui="dashkit" variant="dark" size="sm" className="w-[150px]" type="button">
                            Creators <ChevronDown size={15} className="align-text-top" />
                        </Button>
                    </DropdownToggle>
                    <DropdownMenu className="mt-1.5">{getCreatorDropdownItems(compressedNft.creators)}</DropdownMenu>
                </Dropdown>
            </div>
        </div>
    );
}

function getCompressedNftPill() {
    const onchainVerifiedToolTip =
        'This NFT does not have a corresponding account, but uses verified ledger data to allow for transfers and trades. The existence of this tag ensures that the compressed NFT is verifiably up-to-date with the chain.';
    return (
        <div className="ml-1.5 inline-flex items-center">
            <Badge ui="dashkit" variant="dark" tone="solid">
                Compressed
            </Badge>
            <InfoTooltip bottom text={onchainVerifiedToolTip} />
        </div>
    );
}
