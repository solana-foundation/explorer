import { ArtContent } from '@components/common/NFTArt';
import { CollectionV1, deserializeCollectionV1 } from '@metaplex-foundation/mpl-core';
import * as Umi from '@metaplex-foundation/umi';
import { fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import { Account } from '@providers/accounts';
import { SystemProgram } from '@solana/web3.js';
import React, { useEffect } from 'react';

export function CoreCollectionHeader({ account }: { account: Account }) {
    const [collection, setCollection] = React.useState<CollectionV1 | null>(null);
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

        setCollection(deserializeCollectionV1(rpcAccount));
    }, [account]);

    useEffect(() => {
        const fetchUri = async () => {
            const data = await fetch(collection?.uri || "");
            setJson(await data.json());
        };
        fetchUri();
    }, [collection?.uri]);

    return (
        <div className="row">
            <div className="col-auto ms-2 d-flex align-items-center">
                <ArtContent pubkey={collection?.publicKey} data={json} />
            </div>
            <div className="col mb-3 ms-0.5 mt-3">
                {<h6 className="header-pretitle ms-1">Metaplex NFT</h6>}
                <div className="d-flex align-items-center">
                    <h2 className="header-title ms-1 align-items-center no-overflow-with-ellipsis">
                        {collection?.name !== '' ? collection?.name : 'No Collection name was found'}
                    </h2>
                </div>
                <div className="mb-3 mt-2">{getIsMutablePill(collection?.updateAuthority !== fromWeb3JsPublicKey(SystemProgram.programId))}</div>
            </div>
        </div>
    );
}


function getIsMutablePill(isMutable: boolean) {
    return <span className="badge badge-pill bg-dark">{`${isMutable ? 'Mutable' : 'Immutable'}`}</span>;
}
