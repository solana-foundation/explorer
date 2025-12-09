import { Slot } from '@radix-ui/react-slot';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { cn } from '@shared/utils';
import { cva } from 'class-variance-authority';
import { ReactNode } from 'react';
import { AlertCircle, Check, Globe } from 'react-feather';

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
            <div className="e-flex e-w-full e-items-start e-gap-2">
                <span className="e-m-0.5 e-flex e-h-4 e-w-4 e-flex-shrink-0 e-items-center e-justify-center e-rounded-full e-bg-accent">
                    <Check className="e-text-heavy-metal-800" size={10} strokeWidth={3} />
                </span>

                <div className="e-w-full e-grow">
                    <div className="e-text-sm e-tracking-tight e-text-neutral-200">Select cluster</div>
                    <div className="e-mt-0.5 e-text-xs e-tracking-tight e-text-neutral-400">
                        Use Devnet with test tokens to avoid real costs
                    </div>
                    {showMainnetWarning && (
                        <div className="e-mt-1 e-flex e-items-center e-gap-1.5 e-rounded">
                            <AlertCircle className="e-text-destructive" size={14} />
                            <div className="e-mt-0.5 e-text-xs e-tracking-tight e-text-destructive">
                                You are connected to Mainnet, which uses real funds
                            </div>
                        </div>
                    )}
                </div>

                <Button variant="outline" size="sm" onClick={onClusterChange}>
                    <Globe className="e-h-3 e-w-3 e-text-neutral-200" size={12} />
                    <div className="e-whitespace-nowrap">{currentCluster}</div>
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
                className
            )}
        >
            {content}
        </Comp>
    );
}

const cardVariants = cva(
    'e-flex e-w-full e-flex-col e-gap-[7px] e-border e-border-heavy-metal-950 e-bg-heavy-metal-800 e-px-3 e-py-2',
    {
        defaultVariants: {
            disabled: false,
        },
        variants: {
            disabled: {
                true: 'e-opacity-50 e-cursor-not-allowed',
            },
        },
    }
);
