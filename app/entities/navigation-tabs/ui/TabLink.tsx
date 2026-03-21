'use client';

import Link from 'next/link';
import React from 'react';

import { cn } from '@/app/components/shared/utils';
import { useNavigationTabsContext } from '@/app/entities/navigation-tabs/model/navigation-tabs-context';

const tabLinkClassName = cn(
    'e-appearance-none e-border-solid e-shadow-none e-outline-none',
    'e-border-b e-border-transparent data-[state=active]:e-border-b-accent',
    'e-bg-transparent',
    'e-px-0 e-py-4',
    'e-text-sm e-font-normal e-text-outer-space-200 data-[state=active]:e-text-white',
    'e-no-underline'
);

export function TabLink({ path, title, className }: { path: string; title: string; className?: string }) {
    const ctx = useNavigationTabsContext();
    const isActive = path === ctx.activeValue;
    return (
        <Link
            href={ctx.buildHref(path)}
            scroll={false}
            role="tab"
            aria-selected={isActive}
            data-state={isActive ? 'active' : 'inactive'}
            className={cn(tabLinkClassName, className)}
        >
            {title}
        </Link>
    );
}
