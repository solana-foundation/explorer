'use client';

// import wallet styles to not redeclare every style
import '@solana/wallet-adapter-react-ui/styles.css';

import { useToast } from '@shared/ui/sonner/use-toast';
import { WalletError } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider as WalletAdapterProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { ComponentProps, FC, PropsWithChildren, useCallback, useMemo } from 'react';

import { useCluster } from '@/app/providers/cluster';
import { clusterUrl } from '@/app/utils/cluster';

export const WalletProvider: FC<
    Pick<ComponentProps<typeof WalletAdapterProvider>, 'autoConnect'> &
        PropsWithChildren & {
            skipToast?: boolean;
        }
> = ({ children, autoConnect, skipToast = false }) => {
    const { cluster, customUrl } = useCluster();
    const endpoint = useMemo(() => clusterUrl(cluster, customUrl), [cluster, customUrl]);
    const toast = useToast();

    const onError = useCallback(
        (error: WalletError) => {
            console.error(error);
            if (!skipToast) {
                toast.custom({ description: error.message, title: 'Wallet Error', type: 'error' });
            }
        },
        [toast, skipToast]
    );

    // use an empty array to allow detect wallets automatically
    const wallets = useMemo(() => [], []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletAdapterProvider wallets={wallets} onError={onError} autoConnect={autoConnect}>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletAdapterProvider>
        </ConnectionProvider>
    );
};
