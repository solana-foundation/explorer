'use client';

import { useConnectedWallet, useDisconnect, useWalletStatus } from '@solana/kit-plugin-wallet/react';
import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';

import { useWalletClient } from '../wallet-provider';
import { signWeb3jsTransaction, signWeb3jsTransactions, type Web3Transaction } from './sign-web3js-transaction';
import { useLoggedWalletError } from './use-logged-wallet-error';

/**
 * Wallet state for the interactive IDL feature, expressed in the web3.js types its transaction
 * building still uses. Signing is delegated to the connected Kit wallet signer.
 */
export function useWallet() {
    const client = useWalletClient();
    const connectedWallet = useConnectedWallet(client);
    const status = useWalletStatus(client);
    // `dispatch` rather than `dispatchAsync`: a superseded call rejects with an AbortError even
    // though the newer one succeeded, so awaiting it would report a double-click as a failure.
    const { dispatch: disconnect, error: disconnectError } = useDisconnect(client);
    useLoggedWalletError(disconnectError);

    const signer = connectedWallet?.signer;

    const publicKey = useMemo(
        () => (connectedWallet ? new PublicKey(connectedWallet.account.address) : undefined),
        [connectedWallet],
    );

    const { signAllTransactions, signTransaction } = useMemo(() => {
        if (!signer) return {};
        return {
            signAllTransactions: <T extends Web3Transaction>(transactions: T[]) =>
                signWeb3jsTransactions(signer, transactions),
            signTransaction: <T extends Web3Transaction>(transaction: T) => signWeb3jsTransaction(signer, transaction),
        };
    }, [signer]);

    return {
        // A watch-only wallet connects without a signer. Reporting it as connected would enable
        // Execute, which then fails at signing time with a misleading "wallet not connected".
        connected: status === 'connected' && Boolean(signer),
        // `pending` covers the pre-hydration window before the stored-account check has run, when a
        // returning user is about to be reconnected.
        connecting: status === 'connecting' || status === 'reconnecting' || status === 'pending',
        disconnect,
        publicKey,
        signAllTransactions,
        signTransaction,
        walletName: connectedWallet?.wallet.name,
    };
}
