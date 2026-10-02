'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@components/shared/ui/dropdown-menu';
import { cn } from '@components/shared/utils';
import Link from 'next/link';
import React from 'react';
import { Menu } from 'react-feather';

import { ExternalLink } from '@/app/components/shared/ui/external-link';

import {
    EXPLORER_REPO_URL,
    FILLED_CONTROL_CLASSES,
    FOCUS_RULE_CLASSES,
    focusRuleStyle,
    GitHubMark,
    isKeyboardFocus,
    type NavRoute,
    OUTLINED_CONTROL_CLASSES,
} from './shared';

/** The destinations as plain text links, with the repo glyph after them. Shown in the wide bar. */
export function NavLinks({ className, routes }: { className?: string; routes: NavRoute[] }) {
    return (
        <ul className={cn('m-0 flex list-none items-center gap-1 p-0', className)}>
            {routes.map(route => (
                <li key={route.id}>
                    <Link
                        href={route.href}
                        aria-current={route.active ? 'page' : undefined}
                        className={cn(
                            'block whitespace-nowrap px-2 py-2.5 text-sm no-underline transition-colors',
                            route.active ? 'text-white' : 'text-outer-space-300 hover:text-white',
                        )}
                    >
                        {route.label}
                    </Link>
                </li>
            ))}
            <li>
                <ExternalLink
                    aria-label="Explorer repo"
                    href={EXPLORER_REPO_URL}
                    className="flex items-center px-2 text-outer-space-300 transition-colors hover:text-white"
                >
                    <GitHubMark className="h-[18px] w-[18px]" />
                </ExternalLink>
            </li>
        </ul>
    );
}

export function NavMenu({
    className,
    filled,
    onOpenChange,
    open,
    routes,
}: {
    className?: string;
    filled?: boolean;
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
    routes: NavRoute[];
}) {
    const [focused, setFocused] = React.useState(false);

    return (
        <DropdownMenu modal={false} open={open} onOpenChange={onOpenChange}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label="Open navigation"
                    style={filled ? focusRuleStyle(focused || Boolean(open)) : undefined}
                    onFocus={event => setFocused(isKeyboardFocus(event.currentTarget))}
                    onBlur={() => setFocused(false)}
                    className={cn(
                        filled ? FILLED_CONTROL_CLASSES : OUTLINED_CONTROL_CLASSES,
                        filled ? FOCUS_RULE_CLASSES : 'data-[state=open]:border-outer-space-500',
                        className,
                    )}
                >
                    <Menu size={18} aria-hidden />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={4} className="w-56 p-1.5">
                {routes.map(route => (
                    <DropdownMenuItem key={route.id} asChild>
                        <Link
                            href={route.href}
                            aria-current={route.active ? 'page' : undefined}
                            className={cn(
                                'cursor-pointer px-3 py-2 no-underline',
                                route.active ? 'text-white' : 'text-outer-space-300',
                            )}
                        >
                            {route.label}
                            {route.active && (
                                <span aria-hidden className="ml-auto h-1.5 w-1.5 rounded-full bg-[#1dd79b]" />
                            )}
                        </Link>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <ExternalLink
                        href={EXPLORER_REPO_URL}
                        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-outer-space-300 no-underline"
                    >
                        <GitHubMark className="h-4 w-4" />
                        Explorer repo
                    </ExternalLink>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
