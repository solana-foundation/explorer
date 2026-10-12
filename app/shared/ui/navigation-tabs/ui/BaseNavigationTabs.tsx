'use client';

import React, { useCallback, useMemo } from 'react';

import { cn } from '@/app/components/shared/utils';
import {
    NavigationTabsContext,
    useTabRegistration,
} from '@/app/shared/ui/navigation-tabs/model/navigation-tabs-context';
import { type NavigationTab } from '@/app/shared/ui/navigation-tabs/model/types';
import { useScrollSpy } from '@/app/shared/ui/navigation-tabs/model/use-scroll-spy';
import { useTabOverflow } from '@/app/shared/ui/navigation-tabs/model/useTabOverflow';
import { useSticky } from '@/app/shared/ui/sticky-header/useSticky';

import { MobileMoreDropdown } from './MobileMoreDropdown';
import { TabLink } from './TabLink';

export type BaseNavigationTabsProps = {
    activeValue?: string;
    buildHref: (path: string) => string;
    children?: React.ReactNode;
    className?: string;
    /** Hover tooltip shown on disabled tabs (e.g. the gated simulation-derived tabs before a run). */
    disabledHint?: React.ReactNode;
    onSelectChange?: (path: string) => void;
    onTabClick?: (path: string, e: React.MouseEvent<HTMLAnchorElement>) => void;
    /**
     * Enables scroll-spy mode: active tab tracks scroll position, clicking scrolls smoothly.
     * Implies `sticky` (scroll-spy tabs are always pinned).
     */
    scrollSpy?: boolean;
    sticky?: boolean;
    tabs: NavigationTab[];
};

export function BaseNavigationTabs({
    tabs,
    activeValue: activeValueProp,
    onSelectChange,
    onTabClick: onTabClickProp,
    buildHref,
    children,
    className,
    disabledHint,
    scrollSpy,
    sticky,
}: BaseNavigationTabsProps) {
    // Scroll-spy tabs are always pinned; `sticky` pins route-based tabs too. Both share the same
    // sticky wrapper + shadow-on-stuck; only the active-tab tracking below is scroll-spy specific.
    const isSticky = scrollSpy || Boolean(sticky);
    const { registeredTabs, registerTab, unregisterTab } = useTabRegistration();

    const { stuck, wrapperRef } = useSticky(isSticky);

    const staticPaths = useMemo(() => new Set(tabs.map(t => t.path)), [tabs]);
    const disabledPaths = useMemo(() => new Set(tabs.filter(t => t.disabled).map(t => t.path)), [tabs]);
    const spyPaths = useMemo(() => tabs.map(t => t.path), [tabs]);

    const allTabs = useMemo(
        () => [...tabs, ...registeredTabs.filter(t => !staticPaths.has(t.path))],
        [tabs, registeredTabs, staticPaths],
    );

    const { measuring, moreMeasureRef, moreTabs, tablistRef, visibleTabs } = useTabOverflow(allTabs);

    // useSticky already publishes the bar height, so the spy must not register it a second time.
    const { active: spyActive, scrollToSection } = useScrollSpy({
        enabled: !!scrollSpy,
        fallbackRef: tablistRef,
        paths: spyPaths,
        registerStickyHeight: false,
        wrapperRef,
    });

    const scrollSpyTabClick = useCallback(
        (path: string, e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            scrollToSection(path);
        },
        [scrollToSection],
    );

    const activeValue = scrollSpy ? spyActive : (activeValueProp ?? '');
    const onTabClick = scrollSpy ? scrollSpyTabClick : onTabClickProp;
    const handleSelectChange = scrollSpy ? scrollToSection : onSelectChange;

    const contextValue = useMemo(
        () => ({ activeValue, buildHref, onTabClick, registerTab, renderTabLink: true, staticPaths, unregisterTab }),
        [activeValue, buildHref, onTabClick, registerTab, staticPaths, unregisterTab],
    );

    const hiddenContextValue = useMemo(() => ({ ...contextValue, renderTabLink: false }), [contextValue]);

    const tabBar = (
        <NavigationTabsContext.Provider value={contextValue}>
            <div ref={tablistRef} role="tablist" className={cn('inline-flex w-full gap-5 overflow-hidden', className)}>
                {visibleTabs.map(tab => (
                    <TabLink
                        key={tab.path}
                        path={tab.path}
                        title={tab.title}
                        disabled={disabledPaths.has(tab.path)}
                        disabledHint={disabledHint}
                    />
                ))}

                {measuring && allTabs.length > 0 && (
                    <div ref={moreMeasureRef} aria-hidden="true">
                        <MobileMoreDropdown tabs={[]} />
                    </div>
                )}

                {moreTabs.length > 0 && (
                    <MobileMoreDropdown
                        tabs={moreTabs}
                        onSelectChange={handleSelectChange}
                        disabledPaths={disabledPaths}
                    />
                )}
            </div>

            {children && (
                <NavigationTabsContext.Provider value={hiddenContextValue}>
                    <div className="hidden">{children}</div>
                </NavigationTabsContext.Provider>
            )}
        </NavigationTabsContext.Provider>
    );

    if (isSticky) {
        return (
            <div
                ref={wrapperRef}
                className={cn(
                    'sticky top-0 z-10',
                    'ml-[calc(50%-50vw)] mr-[calc(50%-50vw)]',
                    'pl-[calc(50vw-50%)] pr-[calc(50vw-50%)]',
                    'overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                    'transition-[box-shadow] duration-200',
                    'bg-heavy-metal-900',
                    stuck && 'shadow-[0_6px_16px_rgba(0,0,0,0.45)]',
                )}
            >
                {tabBar}
            </div>
        );
    }

    return tabBar;
}
