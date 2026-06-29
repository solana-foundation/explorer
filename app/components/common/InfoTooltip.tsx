import { cn } from '@components/shared/utils';
import { ReactNode } from 'react';
import { HelpCircle } from 'react-feather';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/shared/ui/tooltip';

type Props = {
    text?: string;
    children?: ReactNode;
    bottom?: boolean;
    right?: boolean;
    withHelpIcon?: boolean;
    className?: string;
};

export function InfoTooltip({ bottom, right, text, children, withHelpIcon = true, className }: Props) {
    if (!text) {
        return <>{children}</>;
    }

    // `bottom`/`right` props are legacy Bootstrap-popover positions; map to Radix `side`.
    const side = bottom ? 'bottom' : right ? 'right' : 'top';
    // Visual alignment of the trigger flex row mirrored the popover position.
    const justify = right ? 'justify-end' : 'justify-start';

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn('flex w-full items-center', justify, className)}>
                    {children}
                    {withHelpIcon && <HelpCircle className="ml-1.5" size={13} />}
                </div>
            </TooltipTrigger>
            <TooltipContent side={side} className="max-w-80">
                {text}
            </TooltipContent>
        </Tooltip>
    );
}
