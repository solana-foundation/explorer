import { Address } from '@components/common/Address';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { Suspense } from 'react';

import { ProxiedImage } from '@/app/features/metadata';

import { UnknownAccountCard } from '../UnknownAccountCard';
import { parseNFTokenCollectionAccount, parseNFTokenNFTAccount } from './isNFTokenAccount';
import { useCollectionNfts } from './nftoken-hooks';
import { NftokenTypes } from './nftoken-types';

export function NFTokenAccountSection({ account }: { account: Account }) {
    const nft = parseNFTokenNFTAccount(account);
    if (nft) {
        return <NFTCard account={account} nft={nft} />;
    }

    const collection = parseNFTokenCollectionAccount(account);
    if (collection) {
        return <CollectionCard account={account} collection={collection} />;
    }

    return <UnknownAccountCard account={account} />;
}

const NFTCard = ({ account, nft }: { account: Account; nft: NftokenTypes.NftAccount }) => {
    const fetchInfo = useRefreshAccount();

    return (
        <AccountCard
            title="Overview"
            account={account}
            refresh={() => fetchInfo(new PublicKey(nft.address), 'parsed')}
            analyticsSection="nft_token_card"
        >
            <tr>
                <td>Address</td>
                <td className="e-text-right">
                    <Address pubkey={new PublicKey(nft.address)} alignRight raw />
                </td>
            </tr>
            <tr>
                <td>Authority</td>
                <td className="e-text-right">
                    <Address pubkey={new PublicKey(nft.authority)} alignRight link />
                </td>
            </tr>
            <tr>
                <td>Holder</td>
                <td className="e-text-right">
                    <Address pubkey={new PublicKey(nft.holder)} alignRight link />
                </td>
            </tr>
            <tr>
                <td>Delegate</td>
                <td className="e-text-right">
                    {nft.delegate ? <Address pubkey={new PublicKey(nft.delegate)} alignRight link /> : 'Not Delegated'}
                </td>
            </tr>
            <tr>
                <td>Collection</td>
                <td className="e-text-right">
                    {nft.collection ? (
                        <Address pubkey={new PublicKey(nft.collection)} alignRight link />
                    ) : (
                        'No Collection'
                    )}
                </td>
            </tr>
        </AccountCard>
    );
};

export const NftokenImage = ({ url, size }: { url: string | undefined; size: number }) => {
    // ProxiedImage owns the whole lifecycle — a skeleton while loading, the image
    // on success, and a logo + reason + "View original" link on failure — so there
    // is no need for a separate loading box or visibility toggling here.
    return (
        <div className="mx-auto e-rounded-dk">
            <ProxiedImage alt="nft" height={size} showOriginalLink uri={url} width={size} />
        </div>
    );
};

const CollectionCard = ({ account, collection }: { account: Account; collection: NftokenTypes.CollectionAccount }) => {
    const fetchInfo = useRefreshAccount();

    return (
        <AccountCard
            title="Overview"
            account={account}
            refresh={() => fetchInfo(new PublicKey(collection.address), 'parsed')}
            analyticsSection="nft_token_collection_card"
        >
            <tr>
                <td>Address</td>
                <td className="e-text-right">
                    <Address pubkey={new PublicKey(collection.address)} alignRight raw />
                </td>
            </tr>
            <tr>
                <td>Authority</td>
                <td className="e-text-right">
                    <Address pubkey={new PublicKey(collection.authority)} alignRight link />
                </td>
            </tr>
            <tr>
                <td>Number of NFTs</td>
                <td className="e-text-right">
                    <Suspense fallback={<div>Loading...</div>}>
                        <NumNfts collection={collection.address} />
                    </Suspense>
                </td>
            </tr>
        </AccountCard>
    );
};

const NumNfts = ({ collection }: { collection: string }) => {
    const { data: nfts } = useCollectionNfts({ collectionAddress: collection });
    return <div>{nfts.length}</div>;
};
