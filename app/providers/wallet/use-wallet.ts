'use client';

import { useConnectedWallet, useDisconnect, useWalletStatus } from '@solana/kit-plugin-wallet/react';
import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';

import { Logger } from '@/app/shared/lib/logger';

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
    const walletAddress = connectedWallet?.account.address;

    const publicKey = useMemo(() => {
        if (!walletAddress) return undefined;
        // A wallet is free to report an account address Explorer cannot parse. Throwing here would
        // propagate out of render and blank the whole IDL tab, so the wallet is instead treated as
        // having no usable account.
        try {
            return new PublicKey(walletAddress);
        } catch (error) {
            Logger.error(error, { sentry: true, walletAddress });
            return undefined;
        }
    }, [walletAddress]);

    const { signAllTransactions, signTransaction } = useMemo(() => {
        if (!signer) return {};
        return {
            signAllTransactions: <T extends Web3Transaction>(transactions: T[]) =>
                signWeb3jsTransactions(signer, transactions),
            signTransaction: <T extends Web3Transaction>(transaction: T) => signWeb3jsTransaction(signer, transaction),
        };
    }, [signer]);

    return {
        // A watch-only wallet connects without a signer. Anything that ends in a signature prompt
        // has to gate on this rather than on `connected`, or Execute is offered and then fails at
        // signing time with a misleading "wallet not connected".
        canSign: Boolean(signer) && Boolean(publicKey),
        // Connection status alone, so a wallet that connected without a signer can still be
        // disconnected.
        connected: status === 'connected',
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
