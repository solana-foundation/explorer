import React from 'react';

import {
    NavigationTabsContext,
    useTabRegistration,
} from '@/app/entities/navigation-tabs/model/navigation-tabs-context';
import { type NavigationTab } from '@/app/entities/navigation-tabs/model/types';

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

    const contextValue = React.useMemo(
        () => ({ activeValue, buildHref, registerTab, unregisterTab }),
        [activeValue, buildHref, registerTab, unregisterTab]
    );

    const allTabs = React.useMemo(() => [...tabs, ...registeredTabs], [tabs, registeredTabs]);

    return (
        <NavigationTabsContext.Provider value={contextValue}>
            <div className={className}>
                <select
                    aria-label="Navigation"
                    className="navigation-tabs-select md:e-hidden"
                    value={activeValue}
                    onChange={e => onSelectChange(e.target.value)}
                >
                    {allTabs.map(tab => (
                        <option key={tab.path} value={tab.path}>
                            {tab.title}
                        </option>
                    ))}
                </select>

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
