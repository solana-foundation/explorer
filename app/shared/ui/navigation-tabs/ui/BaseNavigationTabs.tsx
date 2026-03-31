'use client';

import React from 'react';

import { cn } from '@/app/components/shared/utils';
import {
    NavigationTabsContext,
    useTabRegistration,
} from '@/app/shared/ui/navigation-tabs/model/navigation-tabs-context';
import { type NavigationTab } from '@/app/shared/ui/navigation-tabs/model/types';
import { useTabOverflow } from '@/app/shared/ui/navigation-tabs/model/useTabOverflow';

import { MobileMoreDropdown } from './MobileMoreDropdown';
import { TabLink } from './TabLink';

export type BaseNavigationTabsProps = {
    activeValue: string;
    buildHref: (path: string) => string;
    children?: React.ReactNode;
    className?: string;
    onSelectChange: (path: string) => void;
    tabs: NavigationTab[];
};

export function BaseNavigationTabs({
    tabs,
    activeValue,
    onSelectChange,
    buildHref,
    children,
    className,
}: BaseNavigationTabsProps) {
    const { registeredTabs, registerTab, unregisterTab } = useTabRegistration();

    const staticPaths = React.useMemo(() => new Set(tabs.map(t => t.path)), [tabs]);

    const contextValue = React.useMemo(
        () => ({ activeValue, buildHref, registerTab, renderTabLink: true, staticPaths, unregisterTab }),
        [activeValue, buildHref, registerTab, staticPaths, unregisterTab],
    );

    const hiddenContextValue = React.useMemo(() => ({ ...contextValue, renderTabLink: false }), [contextValue]);

    const allTabs = React.useMemo(
        () => [...tabs, ...registeredTabs.filter(t => !staticPaths.has(t.path))],
        [tabs, registeredTabs, staticPaths],
    );

    const { measuring, moreMeasureRef, moreTabs, tablistRef, visibleTabs } = useTabOverflow(allTabs);

    return (
        <NavigationTabsContext.Provider value={contextValue}>
            <div
                ref={tablistRef}
                role="tablist"
                className={cn('e-inline-flex e-w-full e-gap-3 e-overflow-hidden', className)}
            >
                {visibleTabs.map(tab => (
                    <TabLink key={tab.path} path={tab.path} title={tab.title} />
                ))}

                {measuring && allTabs.length > 0 && (
                    <div ref={moreMeasureRef} aria-hidden="true">
                        <MobileMoreDropdown tabs={[]} />
                    </div>
                )}

                {moreTabs.length > 0 && <MobileMoreDropdown tabs={moreTabs} onSelectChange={onSelectChange} />}
            </div>

            {children && (
                <NavigationTabsContext.Provider value={hiddenContextValue}>
                    <div className="e-hidden">{children}</div>
                </NavigationTabsContext.Provider>
            )}
        </NavigationTabsContext.Provider>
    );
}
