import { cn } from '@components/shared/utils';
import { type ReactNode } from 'react';
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

    const content = (
        <TooltipContent side={side} className="max-w-80">
            {text}
        </TooltipContent>
    );

    // Without an icon, the whole children node is the hover target.
    if (!withHelpIcon) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className={cn('inline-flex cursor-help', className)}>{children}</span>
                </TooltipTrigger>
                {content}
            </Tooltip>
        );
    }

    // The help icon (not the label) is the hover target, so the tooltip only opens over the
    // question mark. `verticalAlign` drops the 13px icon onto the ~13px text's optical center.
    const icon = (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="ml-1 inline-flex cursor-help" style={{ verticalAlign: '-2px' }}>
                    <HelpCircle size={13} />
                </span>
            </TooltipTrigger>
            {content}
        </Tooltip>
    );

    // We want the icon to sit right after the label's *last word* and wrap *with* it, not float
    // after the whole (possibly multi-line) block. An inline SVG is an atomic inline, so the
    // browser may break the line right before it; keeping the last word + icon in a single
    // `white-space: nowrap` run is the only reliable way to forbid that break (a WORD JOINER is
    // ignored across the element boundary). Earlier words still wrap on their spaces as normal.
    if (typeof children === 'string') {
        // eslint-disable-next-line no-restricted-syntax -- concise trailing-whitespace trim before locating the label's last word
        const trimmed = children.replace(/\s+$/, '');
        const cut = trimmed.lastIndexOf(' ');
        if (cut === -1) {
            // Single word: the whole label + icon is one unbreakable run.
            return (
                <span className={className} style={{ whiteSpace: 'nowrap' }}>
                    {trimmed}
                    {icon}
                </span>
            );
        }
        return (
            <span className={className}>
                {trimmed.slice(0, cut)}{' '}
                <span style={{ whiteSpace: 'nowrap' }}>
                    {trimmed.slice(cut + 1)}
                    {icon}
                </span>
            </span>
        );
    }

    // Non-string children: append the icon inline (it may wrap onto its own line if the label
    // wraps, since we can't isolate the last word of an arbitrary node).
    return (
        <span className={className}>
            {children}
            {icon}
        </span>
    );
}
