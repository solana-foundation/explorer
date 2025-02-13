import { InfoTooltip } from '@components/common/InfoTooltip';
import { ArtContent } from '@components/common/NFTArt';
import { AssetV1, deserializeAssetV1 } from '@metaplex-foundation/mpl-core';
import * as Umi from '@metaplex-foundation/umi';
import { fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import { Account } from '@providers/accounts';
import React, { useEffect } from 'react';

export function CoreAssetHeader({ account }: { account: Account }) {
    const [asset, setAsset] = React.useState<AssetV1 | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [json, setJson] = React.useState<any | null>(null);

    useEffect(() => {
        const rpcAccount: Umi.RpcAccount = {
            data: Uint8Array.from(account.data.raw || new Uint8Array()),
            executable: account.executable,
            lamports: Umi.lamports(account.lamports),
            owner: fromWeb3JsPublicKey(account.owner),
            publicKey: fromWeb3JsPublicKey(account.pubkey),
        };

        setAsset(deserializeAssetV1(rpcAccount));
    }, [account]);

    let collectionAddress: Umi.PublicKey | null = null;
    if (asset?.updateAuthority.type === 'Collection') {
        collectionAddress = asset?.updateAuthority.address || null;
    }

    useEffect(() => {
        const fetchUri = async () => {
            const data = await fetch(asset?.uri || "");
            setJson(await data.json());
        };
        fetchUri();
    }, [asset?.uri]);

    return (
        <div className="row">
            <div className="col-auto ms-2 d-flex align-items-center">
                <ArtContent pubkey={asset?.publicKey} data={json} />
            </div>
            <div className="col mb-3 ms-0.5 mt-3">
                {<h6 className="header-pretitle ms-1">Metaplex NFT</h6>}
                <div className="d-flex align-items-center">
                    <h2 className="header-title ms-1 align-items-center no-overflow-with-ellipsis">
                        {asset?.name !== '' ? asset?.name : 'No NFT name was found'}
                    </h2>
                    {collectionAddress ? getVerifiedCollectionPill() : null}
                </div>
                <div className="mb-3 mt-2">{getIsMutablePill(asset?.updateAuthority.type !== "None")}</div>
            </div>
        </div>
    );
}

function getIsMutablePill(isMutable: boolean) {
    return <span className="badge badge-pill bg-dark">{`${isMutable ? 'Mutable' : 'Immutable'}`}</span>;
}

function getVerifiedCollectionPill() {
    const onchainVerifiedToolTip =
        'This NFT has been verified as a member of an on-chain collection. This tag guarantees authenticity.';
    return (
        <div className={'d-inline-flex align-items-center ms-2'}>
            <span className="badge badge-pill bg-dark">{'Verified Collection'}</span>
            <InfoTooltip bottom text={onchainVerifiedToolTip} />
        </div>
    );
}
