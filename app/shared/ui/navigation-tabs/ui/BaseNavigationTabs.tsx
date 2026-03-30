'use client';

import React from 'react';

import { cn } from '@/app/components/shared/utils';
import {
    NavigationTabsContext,
    useTabRegistration,
} from '@/app/shared/ui/navigation-tabs/model/navigation-tabs-context';
import { type NavigationTab } from '@/app/shared/ui/navigation-tabs/model/types';

import { MobileMoreDropdown } from './MobileMoreDropdown';
import { TabLink } from './TabLink';

// Must match e-gap-3
const CONTAINER_GAP_PX = 12;

function getTabsKey(tabs: NavigationTab[]) {
    return tabs.map(tab => `${tab.path}:${tab.title}`).join('|');
}

function getVisibleTabsCount({
    moreMeasure,
    tabElements,
    tablist,
}: {
    moreMeasure: HTMLDivElement;
    tabElements: HTMLElement[];
    tablist: HTMLDivElement;
}) {
    const containerRect = tablist.getBoundingClientRect();
    const containerWidth = containerRect.width;

    if (containerWidth === 0) return tabElements.length;

    const moreWidth = moreMeasure.getBoundingClientRect().width;
    const hiddenTabIndex = tabElements.findIndex((tabElement, index) => {
        const tabRight = tabElement.getBoundingClientRect().right - containerRect.left;
        const reservedMoreWidth = index < tabElements.length - 1 ? CONTAINER_GAP_PX + moreWidth : 0;
        return tabRight + reservedMoreWidth > containerWidth;
    });

    return hiddenTabIndex === -1 ? tabElements.length : hiddenTabIndex;
}

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

    const moreMeasureRef = React.useRef<HTMLDivElement>(null);
    const staticPaths = React.useMemo(() => new Set(tabs.map(t => t.path)), [tabs]);
    const tablistRef = React.useRef<HTMLDivElement>(null);

    const contextValue = React.useMemo(
        () => ({ activeValue, buildHref, registerTab, renderTabLink: true, staticPaths, unregisterTab }),
        [activeValue, buildHref, registerTab, staticPaths, unregisterTab],
    );

    const hiddenContextValue = React.useMemo(() => ({ ...contextValue, renderTabLink: false }), [contextValue]);

    const allTabs = React.useMemo(
        () => [...tabs, ...registeredTabs.filter(t => !staticPaths.has(t.path))],
        [tabs, registeredTabs, staticPaths],
    );
    const allTabsKey = React.useMemo(() => getTabsKey(allTabs), [allTabs]);

    const [measuring, setMeasuring] = React.useState(true);
    const [visibleCount, setVisibleCount] = React.useState<number>(allTabs.length);

    React.useLayoutEffect(() => {
        setMeasuring(true);
        setVisibleCount(allTabs.length);
    }, [allTabs.length, allTabsKey]);

    React.useLayoutEffect(() => {
        if (!measuring) return;

        const tablist = tablistRef.current;
        if (!tablist) return;
        if (allTabs.length === 0) {
            setVisibleCount(0);
            setMeasuring(false);
            return;
        }

        const moreMeasure = moreMeasureRef.current;
        if (!moreMeasure) return;

        const tabElements = Array.from(tablist.querySelectorAll<HTMLElement>('[role="tab"]'));
        setVisibleCount(getVisibleTabsCount({ moreMeasure, tabElements, tablist }));
        setMeasuring(false);
    }, [allTabs.length, allTabsKey, measuring]);

    React.useEffect(() => {
        const tablist = tablistRef.current;
        if (!tablist) return;

        const observer = new ResizeObserver(() => setMeasuring(true));
        observer.observe(tablist);

        let isMounted = true;
        const fonts = document.fonts;
        if (fonts) {
            fonts.ready.then(() => {
                if (isMounted) setMeasuring(true);
            });
        }

        return () => {
            isMounted = false;
            observer.disconnect();
        };
    }, []);

    const visibleTabs = measuring ? allTabs : allTabs.slice(0, visibleCount);
    const moreTabs = measuring ? [] : allTabs.slice(visibleCount);

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
