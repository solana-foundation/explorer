import { truncateAddress } from '@entities/address';
import WalletIcon from '@img/icons/wallet.svg';
import { Slot } from '@radix-ui/react-slot';
import { Button } from '@shared/ui/button';
import { cn } from '@shared/utils';
import { cva } from 'class-variance-authority';
import Image from 'next/image';
import { ReactNode, useMemo } from 'react';
import { AlertCircle, Check } from 'react-feather';

import { Card } from '@/app/shared/ui/Card';

import { BaseConnectWalletButton } from './BaseConnectWalletButton';

const LABELS = {
    'change-wallet': 'Change wallet',
    connecting: 'Connecting ...',
    copied: 'Copied',
    'copy-address': 'Copy address',
    disconnect: 'Disconnect',
    'has-wallet': 'Connect',
    'no-wallet': 'Select Wallet',
} as const;

const cardVariants = cva(
    'flex w-full items-center justify-between gap-[7px] border border-[#000000] bg-[#282D2B] px-3 py-2 shadow-[3px_12px_24px_0px_rgba(20,24,22,0.5)]',
    {
        defaultVariants: {
            clickable: false,
            disabled: false,
        },
        variants: {
            clickable: {
                true: 'cursor-pointer hover:bg-[#2A2F2D]',
            },
            disabled: {
                true: 'opacity-50 cursor-not-allowed',
            },
        },
    },
);

type BaseConnectWalletProps = {
    connected: boolean;
    connecting?: boolean;
    onConnect?: () => void;
    onDisconnect?: () => void;
    address?: string;
    asChild?: boolean;
    buttonState?: string;
    disabled?: boolean;
    className?: string;
    children?: ReactNode;
    labels?: typeof LABELS;
};

export function BaseConnectWallet({
    connected,
    onConnect,
    onDisconnect,
    address,
    asChild = false,
    buttonState,
    disabled = false,
    className,
    labels = LABELS,
}: BaseConnectWalletProps) {
    const isDisabled = disabled || (!connected && !onConnect);
    const isClickable = !connected && !isDisabled && Boolean(onConnect);

    const handleClick = () => {
        if (isClickable && onConnect) {
            onConnect();
        }
    };

    const displayLabel = useMemo(() => {
        if (buttonState === 'connecting' || buttonState === 'has-wallet') {
            return labels?.[buttonState];
        } else {
            return labels?.['no-wallet'];
        }
    }, [buttonState, labels]);

    const content = (
        <>
            <div className="flex w-full items-start gap-2">
                {connected ? (
                    <span className="m-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-accent">
                        <Check className="text-heavy-metal-800" size={10} strokeWidth={3} />
                    </span>
                ) : (
                    <AlertCircle className="m-0.5 shrink-0 text-destructive" size={16} />
                )}
                <div className="w-full grow">
                    {!connected ? (
                        <>
                            <div className="text-sm tracking-tight text-neutral-200">Connect wallet</div>
                            <div className="mt-0.5 text-xs tracking-tight text-neutral-400">
                                Link your wallet
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-sm tracking-tight text-neutral-200">Connect wallet</div>
                            <div className="mt-0.5 text-xs tracking-tight text-neutral-400">
                                Wallet connected
                            </div>
                        </>
                    )}
                </div>
                <div className="shrink-0 grow-0">
                    {!connected && (
                        <Button variant="outline" size="sm" onClick={onConnect}>
                            <Image src={WalletIcon} width={12} height={12} alt="" />
                            <div className="whitespace-nowrap">{displayLabel}</div>
                        </Button>
                    )}
                    {connected && address && (
                        <BaseConnectWalletButton onClick={onDisconnect} displayAddress={truncateAddress(address)} />
                    )}
                </div>
            </div>
        </>
    );

    const Comp = asChild ? Slot : Card;

    return (
        <Comp
            variant="narrow"
            className={cn(
                cardVariants({
                    clickable: isClickable,
                    disabled: isDisabled,
                }),
                className,
            )}
            onClick={handleClick}
        >
            {content}
        </Comp>
    );
}
