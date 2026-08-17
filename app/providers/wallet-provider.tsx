'use client';

// Kit registers plugin cleanup through `DisposableStack`, which browsers only gained in 2025.
// Installs the global only where it is missing.
import 'disposablestack/auto';

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
 * both and flash a disconnected UI. The cache is bounded by the number of chains
 * {@link clusterToWalletChain} can return, so the clients are held for the life of the page rather
 * than disposed; disposing one would defeat the reconnect it exists to preserve.
 */
const walletClients = new Map<string, WalletClient>();

function getWalletClient(chain: WalletChain, autoConnect: boolean): WalletClient {
    const key = `${chain}:${autoConnect}`;
    const cached = walletClients.get(key);
    if (cached) return cached;

    // Each chain persists its own selection. Sharing one key would let a wallet connected on
    // mainnet reappear as connected on devnet, and a disconnect on either clear both.
    const client = createClient().use(walletSigner({ autoConnect, chain, storageKey: `kit-wallet:${chain}` }));
    walletClients.set(key, client);
    return client;
}

export const WalletProvider: FC<PropsWithChildren<{ autoConnect?: boolean }>> = ({ children, autoConnect = false }) => {
    const { cluster } = useCluster();
    const client = useMemo(() => getWalletClient(clusterToWalletChain(cluster), autoConnect), [cluster, autoConnect]);

    return <ClientProvider client={client}>{children}</ClientProvider>;
};

export function useWalletClient(): WalletClient {
    return useClient<ClientWithWallet>();
}
