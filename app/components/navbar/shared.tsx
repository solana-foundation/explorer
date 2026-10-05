'use client';

import { FOCUS_RULE_CLASSES, focusRuleStyle, isKeyboardFocus } from '@components/shared/focus-rule';
import { cn } from '@components/shared/utils';
import Logo from '@img/logos-solana/dark-explorer-logo.svg';
import { useClusterPath } from '@utils/url';
import Image from 'next/image';
import Link from 'next/link';
import { useSelectedLayoutSegment, useSelectedLayoutSegments } from 'next/navigation';
import React from 'react';

export { FOCUS_RULE_CLASSES, focusRuleStyle, isKeyboardFocus };

export const EXPLORER_REPO_URL = 'https://github.com/solana-foundation/explorer';

export const BAR_CLASSES = 'border-0 border-b border-solid border-outer-space-800 bg-heavy-metal-850 text-white';
export const GUTTER_CLASSES = 'px-4 lg:px-6';

const OUTLINED_CONTROL_BASE =
    'flex h-[38px] w-[38px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-solid border-outer-space-700 p-0 text-white transition-colors hover:border-outer-space-600';

export const OUTLINED_CONTROL_CLASSES = cn(OUTLINED_CONTROL_BASE, 'bg-transparent');
export const FILLED_CONTROL_CLASSES = cn(OUTLINED_CONTROL_BASE, 'bg-heavy-metal-800');

export function BrandLockup({ className }: { className?: string }) {
    const homePath = useClusterPath({ pathname: '/' });
    return (
        <Link href={homePath} className={cn('flex min-w-0 shrink-0 flex-col items-start leading-none', className)}>
            <span className="block overflow-hidden" style={{ width: 112 }}>
                <Image alt="Solana" height={22} src={Logo} width={214} priority className="max-w-none" />
            </span>
            <span className="ml-[8px] mt-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-[#b4b4b4]">
                Explorer (beta)
            </span>
        </Link>
    );
}

export interface NavRoute {
    active: boolean;
    href: string;
    id: 'feature-gates' | 'inspector' | 'mcp';
    label: string;
}

export function useNavRoutes(): NavRoute[] {
    const featureGatesPath = useClusterPath({ pathname: '/feature-gates' });
    const inspectorPath = useClusterPath({ pathname: '/tx/inspector' });
    const segment = useSelectedLayoutSegment();
    const segments = useSelectedLayoutSegments();
    return [
        { active: segment === 'feature-gates', href: featureGatesPath, id: 'feature-gates', label: 'Feature Gates' },
        { active: segment === 'mcp', href: '/mcp/start', id: 'mcp', label: 'MCP' },
        {
            active: segments[0] === 'tx' && segments[1] === '(inspector)',
            href: inspectorPath,
            id: 'inspector',
            label: 'Inspector',
        },
    ];
}

export function GitHubMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 98 98" className={cn('shrink-0', className)} xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
                fill="currentColor"
            />
        </svg>
    );
}
