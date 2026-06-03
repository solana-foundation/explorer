import type { ReactNode } from 'react';
import { HelpCircle } from 'react-feather';

import { cn } from '@/app/components/shared/utils';

import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip';

export type ExternalResourceLinkProps = {
    href: string;
    children?: ReactNode;
    className?: string;
};

const EXTERNAL_RESOURCE_HINT = 'Clicking this link will open an external resource';

/**
 * "View original ↗"-style affordance linking to an external, third-party
 * resource. Opens in a new tab with `rel="noopener noreferrer"`, and carries an
 * info tooltip making clear the destination is outside the app. Used as the
 * escape hatch when a proxied image can't be displayed.
 */
export function ExternalResourceLink({ href, children = 'View original', className }: ExternalResourceLinkProps) {
    return (
        <span
            className={cn(
                'e-inline-flex e-items-center e-gap-1.5 e-text-dk-xs e-uppercase e-tracking-wider e-text-dk-gray-600',
                className,
            )}
        >
            <a
                className="e-text-dk-gray-600 hover:e-text-dk-white"
                href={href}
                rel="noopener noreferrer"
                target="_blank"
            >
                {children}
            </a>
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
