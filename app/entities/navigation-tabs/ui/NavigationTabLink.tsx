'use client';

import React from 'react';

import { useNavigationTabsContext } from '@/app/entities/navigation-tabs/model/navigation-tabs-context';

import { TabLink } from './TabLink';

export function NavigationTabLink({ path, title, className }: { path: string; title: string; className?: string }) {
    const ctx = useNavigationTabsContext();

    React.useEffect(() => {
        ctx.registerTab({ path, title });
        return () => ctx.unregisterTab(path);
    }, [path, title]); // eslint-disable-line react-hooks/exhaustive-deps

    return <TabLink path={path} title={title} className={className} />;
}
