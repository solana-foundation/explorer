import { truncateAddress } from '@entities/address';
import WalletIcon from '@img/icons/wallet.svg';
import { Slot } from '@radix-ui/react-slot';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { cn } from '@shared/utils';
import { cva } from 'class-variance-authority';
import Image from 'next/image';
import { ReactNode, useMemo } from 'react';
import { AlertCircle, Check } from 'react-feather';

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
    'e-flex e-w-full e-items-center e-justify-between e-gap-[7px] e-border e-border-[#000000] e-bg-[#282D2B] e-px-3 e-py-2 e-shadow-[3px_12px_24px_0px_rgba(20,24,22,0.5)]',
    {
        defaultVariants: {
            clickable: false,
            disabled: false,
        },
        variants: {
            clickable: {
                true: 'e-cursor-pointer hover:e-bg-[#2A2F2D]',
            },
            disabled: {
                true: 'e-opacity-50 e-cursor-not-allowed',
            },
        },
    }
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
            <div className="e-flex e-w-full e-items-start e-gap-2">
                {connected ? (
                    <span className="e-m-0.5 e-flex e-h-4 e-w-4 e-flex-shrink-0 e-items-center e-justify-center e-rounded-full e-bg-accent">
                        <Check className="e-text-heavy-metal-800" size={10} strokeWidth={3} />
                    </span>
                ) : (
                    <AlertCircle className="e-m-0.5 e-shrink-0 e-text-destructive" size={16} />
                )}
                <div className="e-w-full e-grow">
                    {!connected ? (
                        <>
                            <div className="e-text-sm e-tracking-tight e-text-neutral-200">Connect wallet</div>
                            <div className="e-mt-0.5 e-text-xs e-tracking-tight e-text-neutral-400">
                                Link your wallet
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="e-text-sm e-tracking-tight e-text-neutral-200">Connect wallet</div>
                            <div className="e-mt-0.5 e-text-xs e-tracking-tight e-text-neutral-400">
                                Wallet connected
                            </div>
                        </>
                    )}
                </div>
                <div className="e-grow-0">
                    {!connected && (
                        <Button variant="outline" size="sm" onClick={onConnect}>
                            <Image src={WalletIcon} width={12} height={12} alt="" />
                            <div className="e-whitespace-nowrap">{displayLabel}</div>
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
                className
            )}
            onClick={handleClick}
        >
            {content}
        </Comp>
    );
}
