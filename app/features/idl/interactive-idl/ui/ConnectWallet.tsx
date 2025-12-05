import { useWalletMultiButton } from '@solana/wallet-adapter-base-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

import { BaseConnectWallet } from './BaseConnectWallet';

export function ConnectWallet() {
    const { wallet, connect, disconnect, connected, connecting, publicKey } = useWallet();
    const { setVisible: setModalVisible } = useWalletModal();
    const { buttonState } = useWalletMultiButton({
        onSelectWallet() {
            setModalVisible(true);
        },
    });
    const { setVisible } = useWalletModal();

    const handleConnect = () => {
        if (connected) {
            disconnect();
        } else if (wallet) {
            connect().catch(e => {
                console.error('Wallet Connect Error:', e);
            });
        } else {
            setVisible(true);
        }
    };

    const walletAddress = publicKey?.toBase58();

    return (
        <BaseConnectWallet
            connected={connected}
            onConnect={handleConnect}
            onDisconnect={handleConnect}
            address={walletAddress}
            disabled={connecting}
            buttonState={buttonState}
        />
    );
}
