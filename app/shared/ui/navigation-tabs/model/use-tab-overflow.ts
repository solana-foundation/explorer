import 'client-only';

import React from 'react';

import { type NavigationTab } from './types';

function getTabsKey(tabs: NavigationTab[]) {
    return tabs.map(tab => `${tab.path}:${tab.title}`).join('|');
}

type TabRect = { right: number };

// The tolerance absorbs sub-pixel rounding from getBoundingClientRect, which would otherwise read the last
// tab as a hair past the edge and hide it behind a phantom overflow.
const SUBPIXEL_TOLERANCE = 0.5;

function isLastTabWithinContainer(lastTab: TabRect, containerLeft: number, containerWidth: number) {
    return lastTab.right - containerLeft <= containerWidth + SUBPIXEL_TOLERANCE;
}

export function getVisibleTabsCount({
    containerRect,
    gap,
    moreWidth,
    tabRects,
}: {
    containerRect: { left: number; width: number };
    gap: number;
    moreWidth: number;
    tabRects: TabRect[];
}): number {
    const { left, width } = containerRect;
    if (width === 0) return tabRects.length;

    const lastTab = tabRects[tabRects.length - 1];
    if (lastTab && isLastTabWithinContainer(lastTab, left, width)) {
        return tabRects.length;
    }

    const hiddenTabIndex = tabRects.findIndex((rect, index) => {
        const tabRight = rect.right - left;
        const reservedMoreWidth = index < tabRects.length - 1 ? gap + moreWidth : 0;
        return tabRight + reservedMoreWidth > width;
    });

    return hiddenTabIndex === -1 ? tabRects.length : hiddenTabIndex;
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

        const containerRect = tablist.getBoundingClientRect();
        const gap = parseFloat(getComputedStyle(tablist).columnGap) || 0;
        const moreWidth = moreMeasure.getBoundingClientRect().width;
        const tabRects = Array.from(tablist.querySelectorAll<HTMLElement>('[role="tab"]')).map(tabElement => ({
            right: tabElement.getBoundingClientRect().right,
        }));

        setVisibleCount(
            getVisibleTabsCount({
                containerRect: { left: containerRect.left, width: containerRect.width },
                gap,
                moreWidth,
                tabRects,
            }),
        );
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
    }, [allTabs.length]);

    const visibleTabs = measuring ? allTabs : allTabs.slice(0, visibleCount);
    const moreTabs = measuring ? [] : allTabs.slice(visibleCount);

    return { measuring, moreMeasureRef, moreTabs, tablistRef, visibleTabs };
}
