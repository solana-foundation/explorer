'use client';

import { createContext, useCallback, useContext, useState } from 'react';

import { type NavigationTab } from './types';

export type NavigationTabsContextValue = {
    activeValue: string;
    buildHref: (path: string) => string;
    registerTab: (tab: NavigationTab) => void;
    renderTabLink: boolean;
    staticPaths: Set<string>;
    unregisterTab: (path: string) => void;
};

export const NavigationTabsContext = createContext<NavigationTabsContextValue | undefined>(undefined);

export function useNavigationTabsContext() {
    const ctx = useContext(NavigationTabsContext);
    if (!ctx) throw new Error('Tab components must be used within NavigationTabs');
    return ctx;
}

export function useTabRegistration() {
    const [registeredTabs, setRegisteredTabs] = useState<NavigationTab[]>([]);

    const registerTab = useCallback((tab: NavigationTab) => {
        setRegisteredTabs(prev => {
            if (prev.some(t => t.path === tab.path)) return prev;
            return [...prev, tab];
        });
    }, []);

    const unregisterTab = useCallback((path: string) => {
        setRegisteredTabs(prev => prev.filter(t => t.path !== path));
    }, []);

    return { registerTab, registeredTabs, unregisterTab };
}
