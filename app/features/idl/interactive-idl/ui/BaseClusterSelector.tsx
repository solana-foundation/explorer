import { Button } from '@components/shared/ui/button';
import { cn } from '@components/shared/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { ReactNode } from 'react';
import { Check, Globe } from 'react-feather';

import { Card } from '@/app/shared/ui/Card';

import { WarningNote } from './WarningNote';

type BaseClusterSelectorProps = {
    currentCluster: string;
    onClusterChange?: () => void;
    asChild?: boolean;
    disabled?: boolean;
    className?: string;
    children?: ReactNode;
    showMainnetWarning?: boolean;
};

export function BaseClusterSelector({
    currentCluster,
    onClusterChange,
    asChild = false,
    disabled = false,
    className,
    showMainnetWarning = false,
}: BaseClusterSelectorProps) {
    const isDisabled = disabled || !onClusterChange;

    const content = (
        <>
            <div className="flex w-full items-start gap-2">
                <span className="m-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-accent">
                    <Check className="text-heavy-metal-800" size={10} strokeWidth={3} />
                </span>

                <div className="w-full grow">
                    <div className="text-sm tracking-tight text-neutral-200">Select cluster</div>
                    <div className="mt-0.5 text-xs tracking-tight text-neutral-400">
                        Use Devnet with test tokens to avoid real costs
                    </div>
                    {showMainnetWarning && (
                        <WarningNote className="mt-1" label="You are connected to Mainnet, which uses real funds" />
                    )}
                </div>

                <Button variant="outline" size="sm" onClick={onClusterChange}>
                    <Globe className="h-3 w-3 text-neutral-200" size={12} />
                    <div className="whitespace-nowrap">{currentCluster}</div>
                </Button>
            </div>
        </>
    );

    const Comp = asChild ? Slot : Card;

    return (
        <Comp
            variant="narrow"
            className={cn(
                cardVariants({
                    disabled: isDisabled,
                }),
                className,
            )}
        >
            {content}
        </Comp>
    );
}

const cardVariants = cva('flex w-full flex-col gap-[7px] border border-heavy-metal-950 bg-heavy-metal-800 px-3 py-2', {
    defaultVariants: {
        disabled: false,
    },
    variants: {
        disabled: {
            true: 'opacity-50 cursor-not-allowed',
        },
    },
});
