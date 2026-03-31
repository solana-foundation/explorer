'use client';

import React from 'react';

import { type NavigationTab } from './types';

export type NavigationTabsContextValue = {
    activeValue: string;
    buildHref: (path: string) => string;
    registerTab: (tab: NavigationTab) => void;
    renderTabLink: boolean;
    staticPaths: Set<string>;
    unregisterTab: (path: string) => void;
};

export const NavigationTabsContext = React.createContext<NavigationTabsContextValue | undefined>(undefined);

export function useNavigationTabsContext() {
    const ctx = React.useContext(NavigationTabsContext);
    if (!ctx) throw new Error('Tab components must be used within NavigationTabs');
    return ctx;
}

export function useTabRegistration() {
    const [registeredTabs, setRegisteredTabs] = React.useState<NavigationTab[]>([]);

    const registerTab = React.useCallback((tab: NavigationTab) => {
        setRegisteredTabs(prev => {
            if (prev.some(t => t.path === tab.path)) return prev;
            return [...prev, tab];
        });
    }, []);

    const unregisterTab = React.useCallback((path: string) => {
        setRegisteredTabs(prev => prev.filter(t => t.path !== path));
    }, []);

    return { registerTab, registeredTabs, unregisterTab };
}
