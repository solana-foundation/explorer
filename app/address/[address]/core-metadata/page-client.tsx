'use client';

import { CoreMetadataCard } from '@components/account/CoreMetadataCard';
import { ParsedAccountRenderer } from '@components/account/ParsedAccountRenderer';
import { AssetV1, CollectionV1, deserializeAssetV1, deserializeCollectionV1, Key } from '@metaplex-foundation/mpl-core';
import { lamports, RpcAccount } from '@metaplex-foundation/umi';
import { fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import React, { useEffect } from 'react';

import { ErrorCard } from '@/app/components/common/ErrorCard';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

function CoreMetadataCardRenderer({
    account,
}: React.ComponentProps<React.ComponentProps<typeof ParsedAccountRenderer>['renderComponent']>) {
    const [asset, setAsset] = React.useState<AssetV1 | CollectionV1 | null>(null);

    useEffect(() => {
        if (!account) {
            return;
        }

        const rpcAccount: RpcAccount = {
            data: Uint8Array.from(account.data.raw || new Uint8Array()),
            executable: account.executable,
            lamports: lamports(account.lamports),
            owner: fromWeb3JsPublicKey(account.owner),
            publicKey: fromWeb3JsPublicKey(account.pubkey),
        };

        if (rpcAccount.data[0] === Key.AssetV1) {
            setAsset(deserializeAssetV1(rpcAccount));
        } else if (rpcAccount.data[0] === Key.CollectionV1) {
            setAsset(deserializeCollectionV1(rpcAccount));
        }
    }, [account]);

    if (!account) {
        return <ErrorCard text="Account is undefined" />;
    } else if (!asset) {
        return <ErrorCard text="Asset is undefined" />;
    } else {
        return <CoreMetadataCard asset={asset} />;
    }
}

export default function MetaplexNFTMetadataPageClient({ params: { address } }: Props) {
    return <ParsedAccountRenderer address={address} renderComponent={CoreMetadataCardRenderer} />;
}
