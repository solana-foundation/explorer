'use client';

import { WalletReadyGate } from '@solana/kit-plugin-wallet/react';
import { useState } from 'react';

import { useWallet } from '@/app/providers/wallet/use-wallet';
import { WalletPickerDialog } from '@/app/providers/wallet/WalletPickerDialog';
import { useWalletClient } from '@/app/providers/wallet-provider';

import { BaseConnectWallet } from './BaseConnectWallet';

// FIXME: missing Storybook story — uses useWallet + the wallet picker; pure BaseConnectWallet is already covered.
function ConnectWalletControl() {
    const { connected, connecting, disconnect, publicKey } = useWallet();
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const handleConnect = () => {
        if (connected) {
            disconnect();
        } else {
            setIsPickerOpen(true);
        }
    };

    return (
        <>
            <BaseConnectWallet
                connected={connected}
                onConnect={handleConnect}
                onDisconnect={handleConnect}
                address={publicKey?.toBase58()}
                disabled={connecting}
                buttonState={connecting ? 'connecting' : 'no-wallet'}
            />
            <WalletPickerDialog open={isPickerOpen} onOpenChange={setIsPickerOpen} />
        </>
    );
}

export function ConnectWallet() {
    const client = useWalletClient();

    // Wallet Standard registration is asynchronous. Without this gate a returning user gets an
    // enabled "Select Wallet" during warm-up, and clicking it opens a picker that claims no wallet
    // is installed.
    return (
        <WalletReadyGate
            client={client}
            fallback={<BaseConnectWallet connected={false} disabled buttonState="connecting" />}
        >
            <ConnectWalletControl />
        </WalletReadyGate>
    );
}
