import { Key } from '@metaplex-foundation/mpl-core';
import * as Umi from '@metaplex-foundation/umi';
import { fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import { Account } from '@providers/accounts';
import React, { useEffect } from 'react';

import { ErrorCard } from '../../common/ErrorCard';
import { CoreAssetHeader } from './CoreAssetHeader';
import { CoreCollectionHeader } from './CoreCollectionHeader';

export function CoreAccountHeader({ account }: { account: Account }) {
    const [umiAccount, setUmiAccount] = React.useState<Umi.RpcAccount | null>(null);

    useEffect(() => {
        const rpcAccount: Umi.RpcAccount = {
            data: Uint8Array.from(account.data.raw || new Uint8Array()),
            executable: account.executable,
            lamports: Umi.lamports(account.lamports),
            owner: fromWeb3JsPublicKey(account.owner),
            publicKey: fromWeb3JsPublicKey(account.pubkey),
        };

        setUmiAccount(rpcAccount);
    }, [account]);

    if (umiAccount && umiAccount.data[0] === Key.AssetV1) {
        return <CoreAssetHeader account={account} />
    } else if (umiAccount && umiAccount.data[0] === Key.CollectionV1) {
        return <CoreCollectionHeader account={account} />
    } else {
        return <ErrorCard text="Invalid Core Account" />
    }
}
