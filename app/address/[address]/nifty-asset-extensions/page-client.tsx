'use client';

import { NiftyAssetExtensionsCard } from '@/app/components/account/nifty-asset/AssetExtensionsCard';
import { ParsedAccountRenderer } from '@components/account/ParsedAccountRenderer';
import { fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import { Asset, deserializeAsset, getAssetAccountDataSerializer } from '@nifty-oss/asset';
import React from 'react';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

function NiftyAssetExtensionsCardRenderer({
    account,
    onNotFound,
}: React.ComponentProps<React.ComponentProps<typeof ParsedAccountRenderer>['renderComponent']>) {
    const data = account?.data.raw;
    const address = account?.pubkey;
    const asset = data && (getAssetAccountDataSerializer().deserialize(data)[0] as Asset);

    if (asset && address) {
        asset.publicKey = fromWeb3JsPublicKey(address);
    }

    return asset && asset.extensions.length > 0 ? <NiftyAssetExtensionsCard asset={asset} /> : onNotFound();
}

export default function MetaplexNFTMetadataPageClient({ params: { address } }: Props) {
    return <ParsedAccountRenderer address={address} renderComponent={NiftyAssetExtensionsCardRenderer} />;
}
