'use client';

import React from 'react';

import { type NavigationTab } from './types';

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

    const gap = parseFloat(getComputedStyle(tablist).columnGap) || 0;
    const moreWidth = moreMeasure.getBoundingClientRect().width;
    const hiddenTabIndex = tabElements.findIndex((tabElement, index) => {
        const tabRight = tabElement.getBoundingClientRect().right - containerRect.left;
        const reservedMoreWidth = index < tabElements.length - 1 ? gap + moreWidth : 0;
        return tabRight + reservedMoreWidth > containerWidth;
    });

    return hiddenTabIndex === -1 ? tabElements.length : hiddenTabIndex;
}

export function useTabOverflow(allTabs: NavigationTab[]) {
    const tablistRef = React.useRef<HTMLDivElement>(null);
    const moreMeasureRef = React.useRef<HTMLDivElement>(null);

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

        return () => {
            observer.disconnect();
        };
    }, []);

    const visibleTabs = measuring ? allTabs : allTabs.slice(0, visibleCount);
    const moreTabs = measuring ? [] : allTabs.slice(visibleCount);

    return { measuring, moreMeasureRef, moreTabs, tablistRef, visibleTabs };
}
