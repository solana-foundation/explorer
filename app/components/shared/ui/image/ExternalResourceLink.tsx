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
};

const EXTERNAL_RESOURCE_HINT = 'Clicking this link will open an external resource';

/**
 * "View original ↗"-style affordance linking to an external, third-party
 * resource: an {@link ExternalLink} (which owns the scheme guard and
 * `rel="noopener noreferrer"` new-tab behaviour) plus an info tooltip making
 * clear the destination is outside the app. Used as the escape hatch when a
 * proxied image can't be displayed.
 */
export function ExternalResourceLink({ href, children = 'View original', className }: ExternalResourceLinkProps) {
    // Guard before rendering the tooltip wrapper too, so an unsafe href that
    // `ExternalLink` would drop doesn't leave an orphan tooltip pointing at no link.
    if (!getSafeExternalHref(href)) return undefined;

    return (
        <span
            className={cn(
                'e-inline-flex e-items-center e-gap-1.5 e-text-dk-xs e-uppercase e-tracking-wider e-text-dk-gray-600',
                className,
            )}
        >
            <ExternalLink className="e-text-dk-gray-600 hover:e-text-dk-white" href={href}>
                {children}
            </ExternalLink>
            <Tooltip>
                <TooltipTrigger
                    aria-label={EXTERNAL_RESOURCE_HINT}
                    className="e-inline-flex e-border-0 e-bg-transparent e-p-0 e-text-dk-gray-600"
                >
                    <HelpCircle aria-hidden size={13} />
                </TooltipTrigger>
                <TooltipContent>{EXTERNAL_RESOURCE_HINT}</TooltipContent>
            </Tooltip>
        </span>
    );
}
