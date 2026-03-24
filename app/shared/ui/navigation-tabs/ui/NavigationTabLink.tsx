'use client';

import React from 'react';

import { useNavigationTabsContext } from '@/app/shared/ui/navigation-tabs/model/navigation-tabs-context';

import { TabLink } from './TabLink';

export function NavigationTabLink({ path, title, className }: { path: string; title: string; className?: string }) {
    const { registerTab, staticPaths, unregisterTab } = useNavigationTabsContext();

    React.useEffect(() => {
        registerTab({ path, title });
        return () => unregisterTab(path);
    }, [path, title, registerTab, unregisterTab]);

    if (staticPaths.has(path)) return null;

    return <TabLink path={path} title={title} className={className} />;
}
