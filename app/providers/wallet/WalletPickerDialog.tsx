'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/shared/ui/dialog';
import { cn } from '@components/shared/utils';
import { useConnect, useWallets } from '@solana/kit-plugin-wallet/react';
import Image from 'next/image';

import { useWalletClient } from '../wallet-provider';
import { useLoggedWalletError } from './use-logged-wallet-error';

type DiscoveredWallet = ReturnType<typeof useWallets>[number];

type WalletPickerDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function WalletPickerDialog({ open, onOpenChange }: WalletPickerDialogProps) {
    const client = useWalletClient();
    const wallets = useWallets(client);
    // `dispatch` rather than `dispatchAsync`: a superseded call rejects with an AbortError even
    // though the newer one succeeded, so awaiting it would report a double-click as a failure.
    const { dispatch: connect, error } = useConnect(client);
    useLoggedWalletError(error);

    const handleSelect = (wallet: DiscoveredWallet) => {
        onOpenChange(false);
        connect(wallet);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Connect a wallet</DialogTitle>
                    <DialogDescription>Choose a detected wallet to connect to the Explorer.</DialogDescription>
                </DialogHeader>
                {wallets.length === 0 ? (
                    <p className="m-0 text-pretty rounded-md border border-neutral-700 bg-neutral-900 px-3 py-4 text-center text-sm text-neutral-400">
                        No wallets detected. Install a Solana wallet extension, then reload this page.
                    </p>
                ) : (
                    // Negative margin lets each row's hover surface bleed to the dialog's padding edge
                    // while the row's own padding keeps its label aligned with the title above.
                    <ul className="-mx-2 my-0 flex list-none flex-col gap-0.5 p-0">
                        {wallets.map(wallet => (
                            <li key={wallet.name}>
                                <button
                                    type="button"
                                    onClick={() => handleSelect(wallet)}
                                    className={cn(
                                        'flex w-full items-center gap-3 rounded-md border-0 bg-transparent px-2 py-2.5',
                                        'text-left text-sm font-medium text-neutral-100',
                                        'transition-colors hover:bg-neutral-700',
                                        'focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-300',
                                    )}
                                >
                                    <Image
                                        src={wallet.icon}
                                        width={24}
                                        height={24}
                                        alt=""
                                        unoptimized
                                        className="size-6 shrink-0 rounded"
                                    />
                                    <span className="truncate">{wallet.name}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </DialogContent>
        </Dialog>
    );
}
