import type { Account } from '@providers/accounts';
import { address, getBase64Encoder } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';

import { NFTOKEN_ADDRESS, type NftokenNftAccount } from '../lib/nftoken-accounts';

export const COLLECTION = address('D2VpbKpT725tdQyaNNZZwwS7Mqzgw4SZb2o4az5wA9vr');
export const MAINNET_AUTHORITY = address('au19QGSfERnBsa9ep6y29PFgNhVLaeSKiCdETotMnm1');
export const WALLET = address('7txXZZD6Um59YoLMF7XUNimbMjsqsWhc7g2EniiTrmp1');

export const MAINNET_COLLECTION = {
    base64: 'RQLwA3YS2fIBCK73Uwf47c2IPQ+w5hPp+lScci3RtMSNH9ZwLhTw8lwBAAAAACkAAABodHRwczovL2Nkbi5nbG93LmFwcC9nL2VoL3h4bDJ4dHM2MDEuanNvbg==',
    metadataUrl: 'https://cdn.glow.app/g/eh/xxl2xts601.json',
    pubkey: COLLECTION,
} as const;

export const MAINNET_NFTS = [
    {
        base64: 'IbRbNewPP2EB15PxMbOJB1ZNleW7N7MLLRPqzwJZzU8BP/m0ezIC4rMIrvdTB/jtzYg9D7DmE+n6VJxyLdG0xI0f1nAuFPDyXAGyrmlTBv86l6arQ/7twYzFIY3JExVPsjLlQ9f9Tc86WwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAApAAAAaHR0cHM6Ly9jZG4uZ2xvdy5hcHAvZy81ZS9yd3dpaDFuc3A4Lmpzb24=',
        holder: address('FWXVkwFE5biPKgJVz1mbY1Xt7bbScGDptLCzgjaTFrdx'),
        metadataUrl: 'https://cdn.glow.app/g/5e/rwwih1nsp8.json',
        pubkey: address('13KhhKUZBMTN6pQ9oVJMc3KrkALdBvWBAQXbL7nCiYWN'),
    },
    {
        base64: 'IbRbNewPP2EBeZMQxzAu3pQTufjXlApPyKNlSuuRgz2RsLonFf8e1SIIrvdTB/jtzYg9D7DmE+n6VJxyLdG0xI0f1nAuFPDyXAGyrmlTBv86l6arQ/7twYzFIY3JExVPsjLlQ9f9Tc86WwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAApAAAAaHR0cHM6Ly9jZG4uZ2xvdy5hcHAvZy9qZS96M2Yxd3ZqZmZtLmpzb24=',
        holder: address('9BaQ2JJTo8SaQrn4CtMvg6nZq1FL2BpXk4suzYaTZ27b'),
        metadataUrl: 'https://cdn.glow.app/g/je/z3f1wvjffm.json',
        pubkey: address('13Y9iPURvuUhugHqfPqAhWsiugoG3ahbA78k3sMS1Esn'),
    },
    {
        base64: 'IbRbNewPP2EB5I/Fdyr1pIgE7GNju19Zqx6Czb2EzT5vaWKmlDa9hJkIrvdTB/jtzYg9D7DmE+n6VJxyLdG0xI0f1nAuFPDyXAGyrmlTBv86l6arQ/7twYzFIY3JExVPsjLlQ9f9Tc86WwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAApAAAAaHR0cHM6Ly9jZG4uZ2xvdy5hcHAvZy9ydC9wYzM0bjUwcW5oLmpzb24=',
        holder: address('GPD7Dd1Em18RUxr5vWPx2Gy9ZpgxjJV4iaE44VBdZMpc'),
        metadataUrl: 'https://cdn.glow.app/g/rt/pc34n50qnh.json',
        pubkey: address('13uXRxYbggzGwBoooLkgguhe1a7ALHhVDYfNhRHuH12h'),
    },
] as const;

export const MAINNET_NFT_ACCOUNTS: NftokenNftAccount[] = MAINNET_NFTS.map(nft => ({
    address: nft.pubkey,
    authority: MAINNET_AUTHORITY,
    authority_can_update: true,
    collection: COLLECTION,
    delegate: undefined,
    holder: nft.holder,
    kind: 'nft',
    metadata_url: nft.metadataUrl,
}));

export const NFT_CAN_UPDATE_OFFSET = 73;
export const COLLECTION_CAN_UPDATE_OFFSET = 41;
export const COLLECTION_FIELD = { end: 106, start: 74 };

export function collectionAccount(): Account {
    return nftokenAccount(accountBytes(MAINNET_COLLECTION.base64), COLLECTION);
}

export function accountBytes(base64: string): Uint8Array {
    return new Uint8Array(getBase64Encoder().encode(base64));
}

export function nftokenAccount(raw: Uint8Array, pubkey: string): Account {
    return {
        data: { raw },
        executable: false,
        lamports: 1,
        owner: new PublicKey(NFTOKEN_ADDRESS),
        pubkey: new PublicKey(pubkey),
        space: raw.length,
    };
}
