import React from 'react';

import {
    NavigationTabsContext,
    useTabRegistration,
} from '@/app/shared/ui/navigation-tabs/model/navigation-tabs-context';
import { type NavigationTab } from '@/app/shared/ui/navigation-tabs/model/types';
import { BaseNativeSelect } from '@/app/shared/ui/native-select';

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
        () => ({ activeValue, buildHref, registerTab, staticPaths, unregisterTab }),
        [activeValue, buildHref, registerTab, staticPaths, unregisterTab],
    );

    const allTabs = React.useMemo(
        () => [...tabs, ...registeredTabs.filter(t => !staticPaths.has(t.path))],
        [tabs, registeredTabs, staticPaths],
    );

    return (
        <NavigationTabsContext.Provider value={contextValue}>
            <div className={className}>
                <BaseNativeSelect
                    aria-label="Navigation"
                    className="navigation-tabs-select md:e-hidden"
                    variant="navigation"
                    icon="menu"
                    value={activeValue}
                    onChange={e => onSelectChange(e.target.value)}
                >
                    {allTabs.map(tab => (
                        <option key={tab.path} value={tab.path}>
                            {tab.title}
                        </option>
                    ))}
                </BaseNativeSelect>

                <div role="tablist" className="e-hidden e-gap-3 md:e-inline-flex">
                    {tabs.map(tab => (
                        <TabLink key={tab.path} path={tab.path} title={tab.title} />
                    ))}
                    {children}
                </div>
            </div>
        </NavigationTabsContext.Provider>
    );
}
