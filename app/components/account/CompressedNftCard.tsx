import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { Suspense } from 'react';

import { ExternalLink, ExternalLinkMark } from '@/app/components/shared/ui/external-link';
import { useCluster } from '@/app/providers/cluster';
import { CompressedNft, useCompressedNft, useMetadataJsonLink } from '@/app/providers/compressed-nft';
import { getProxiedUri } from '@/app/shared/lib/metadata-proxy';
import { type KeyValueRowInput, KeyValueRows } from '@/app/shared/ui/key-value';

import { Address } from '../common/Address';
import { LoadingArtPlaceholder } from '../common/LoadingArtPlaceholder';
import { type NftHeaderModel } from './nft-header/model';
import { NftHeaderLayout } from './nft-header/NftHeaderVariants';
import { nftCreatorsOverviewRow, nftOverviewRows } from './nft-header/overview-rows';
import { useNftCollection } from './nft-header/use-nft-collection';
import { UnknownAccountCard } from './UnknownAccountCard';

export function CompressedNftCard({ account }: { account: Account }) {
    const { url } = useCluster();
    const compressedNft = useCompressedNft({ address: account.pubkey.toString(), url });
    // getAsset resolves fungible tokens too, and those have no single owner: DAS returns an empty
    // string, which is not a public key. Without an owner this card has nothing to describe.
    if (!compressedNft?.ownership.owner) return <UnknownAccountCard account={account} />;

    const collectionGroup = compressedNft.grouping.find(group => group.group_key === 'collection');
    const updateAuthority = compressedNft.authorities.find(authority => authority.scopes.includes('full'))?.address;
    const website = compressedNft.content.links.external_url;

    const rows: KeyValueRowInput[] = [
        { label: 'Address', value: <Address pubkey={account.pubkey} raw /> },
        { label: 'Owner', value: <Address pubkey={new PublicKey(compressedNft.ownership.owner)} link /> },
        {
            label: 'Verified Collection Address',
            value: collectionGroup ? <Address pubkey={new PublicKey(collectionGroup.group_value)} link /> : 'None',
        },
        {
            label: 'Update Authority',
            value: updateAuthority ? <Address pubkey={new PublicKey(updateAuthority)} link /> : 'None',
        },
        nftCreatorsOverviewRow(compressedNft),
        {
            label: 'Website',
            value: website ? (
                <ExternalLink href={website}>
                    {website}
                    <ExternalLinkMark />
                </ExternalLink>
            ) : (
                <span className="text-outer-space-300">—</span>
            ),
        },
        { label: 'Seller Fee', value: `${compressedNft.royalty.basis_points / 100}%` },
        ...nftOverviewRows(compressedNftHeaderModel(compressedNft)),
    ];

    return (
        <AccountCard title="Overview" account={account}>
            <KeyValueRows rows={rows} />
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
    const proxiedURI = compressedNft.content.json_uri ? getProxiedUri(compressedNft.content.json_uri) : null;
    const metadataJson = useMetadataJsonLink(proxiedURI);
    const collectionAddress = compressedNft.grouping.find(group => group.group_key === 'collection')?.group_value;
    const { name: collectionName } = useNftCollection(collectionAddress);
    const model = compressedNftHeaderModel(compressedNft, { collectionName, image: metadataJson?.image });
    return <NftHeaderLayout model={model} />;
}

export function compressedNftHeaderModel(
    compressedNft: CompressedNft,
    { collectionName, image }: { collectionName?: string; image?: string } = {},
): NftHeaderModel {
    const { name, symbol } = compressedNft.content.metadata;
    const collectionAddress = compressedNft.grouping.find(group => group.group_key === 'collection')?.group_value;
    return {
        // Any collection grouping counts as verified, as in the header this replaces.
        collection: collectionAddress ? { address: collectionAddress, name: collectionName } : undefined,
        compressed: compressedNft.compression.compressed,
        creators: compressedNft.creators,
        image,
        mutable: compressedNft.mutable,
        name: name !== '' ? name : 'Unnamed asset',
        symbol: symbol !== '' ? symbol : undefined,
        typeLabel: getAssetTypeLabel(compressedNft),
    };
}

// getAsset resolves any indexed asset, not just compressed NFTs, so the type shown has to follow
// the response instead of assuming compression.
const ASSET_TYPE_LABELS: Record<string, string> = {
    Custom: 'Custom Asset',
    Executable: 'Executable Asset',
    FungibleAsset: 'Fungible Asset',
    FungibleToken: 'Token',
    Identity: 'Identity Asset',
    LEGACY_NFT: 'Metaplex NFT',
    MplCoreAsset: 'Metaplex Core Asset',
    MplCoreCollection: 'Metaplex Core Collection',
    ProgrammableNFT: 'Metaplex Programmable NFT',
    V1_NFT: 'Metaplex NFT',
    V1_PRINT: 'Metaplex NFT Print',
    V2_NFT: 'Metaplex NFT',
};

export function getAssetTypeLabel(asset: CompressedNft): string {
    if (asset.compression.compressed) return 'Metaplex Compressed NFT';
    return ASSET_TYPE_LABELS[asset.interface] ?? 'Asset';
}
