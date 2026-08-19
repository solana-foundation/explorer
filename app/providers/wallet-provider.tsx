'use client';

import './wallet/disposable-stack-polyfill';

import { type Client, createClient } from '@solana/kit';
import { type ClientWithWallet, walletSigner } from '@solana/kit-plugin-wallet';
import { ClientProvider, useClient } from '@solana/react';
import { FC, PropsWithChildren, useMemo } from 'react';

import { useCluster } from '@/app/providers/cluster';

import { clusterToWalletChain, type WalletChain } from './wallet/cluster-chain';

export type WalletClient = Client<ClientWithWallet>;

/**
 * Wallet clients are cached per chain because each one runs its own Wallet Standard discovery and
 * silent reconnect. Rebuilding on every mount — or on every hop between two clusters — would restart
 * both and flash a disconnected UI. The chain is the only dimension of the key, so the cache is
 * bounded by the number of values {@link clusterToWalletChain} can return, and the clients are held
 * for the life of the page rather than disposed; disposing one would defeat the reconnect it exists
 * to preserve.
 */
const walletClients = new Map<WalletChain, WalletClient>();

function getWalletClient(chain: WalletChain): WalletClient {
    const cached = walletClients.get(chain);
    if (cached) return cached;

    // Each chain persists its own selection. Sharing one storage key would let a wallet connected on
    // mainnet reappear as connected on devnet, and a disconnect on either clear both.
    const client = createClient().use(walletSigner({ autoConnect: true, chain, storageKey: `kit-wallet:${chain}` }));
    walletClients.set(chain, client);
    return client;
}

export const WalletProvider: FC<PropsWithChildren> = ({ children }) => {
    const { cluster } = useCluster();
    const client = useMemo(() => getWalletClient(clusterToWalletChain(cluster)), [cluster]);

    return <ClientProvider client={client}>{children}</ClientProvider>;
};

export function useWalletClient(): WalletClient {
    return useClient<ClientWithWallet>();
}
