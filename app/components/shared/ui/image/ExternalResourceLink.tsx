import type { ReactNode } from 'react';
import { HelpCircle } from 'react-feather';

import { cn } from '@/app/components/shared/utils';
import { getSafeExternalHref } from '@/app/shared/lib/url';

import { ExternalLink } from '../external-link';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip';

export type ExternalResourceLinkProps = {
    href: string;
    children?: ReactNode;
    className?: string;
    /**
     * Optional detail shown in the info tooltip (and the trigger's accessible
     * label) alongside the external-resource hint — e.g. why the resource
     * couldn't be displayed ("Image exceeds maximum size"). Not added to the link text.
     */
    detail?: string;
};

const EXTERNAL_RESOURCE_HINT = 'Clicking this link will open an external resource';

/**
 * "View original ↗"-style affordance linking to an external, third-party
 * resource: an {@link ExternalLink} (which owns the scheme guard and
 * `rel="noopener noreferrer"` new-tab behaviour) plus an info tooltip making
 * clear the destination is outside the app. Used as the escape hatch when a
 * proxied image can't be displayed.
 */
export function ExternalResourceLink({
    href,
    children = 'View original',
    className,
    detail,
}: ExternalResourceLinkProps) {
    // Guard before rendering the tooltip wrapper too, so an unsafe href that
    // `ExternalLink` would drop doesn't leave an orphan tooltip pointing at no link.
    if (!getSafeExternalHref(href)) return undefined;

    // `detail` (e.g. why the image couldn't be shown) rides in the info tooltip
    // beside the external-resource hint — not in the link text, so the label stays
    // terse — and is joined into the trigger's aria-label so it's announced too.
    const hint = detail ? `${detail}. ${EXTERNAL_RESOURCE_HINT}` : EXTERNAL_RESOURCE_HINT;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 text-dk-xs uppercase tracking-wider text-dk-gray-600',
                className,
            )}
        >
            <ExternalLink className="text-dk-gray-600 hover:text-dk-white" href={href}>
                {children}
            </ExternalLink>
            <Tooltip>
                <TooltipTrigger aria-label={hint} className="inline-flex border-0 bg-transparent p-0 text-dk-gray-600">
                    <HelpCircle aria-hidden size={13} />
                </TooltipTrigger>
                <TooltipContent>
                    {detail ? (
                        <div className="flex flex-col gap-1">
                            <span className="font-medium">{detail}</span>
                            <span>{EXTERNAL_RESOURCE_HINT}</span>
                        </div>
                    ) : (
                        EXTERNAL_RESOURCE_HINT
                    )}
                </TooltipContent>
            </Tooltip>
        </span>
    );
}
