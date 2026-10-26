'use client';

import { cn } from '@components/shared/utils';
import type { Idl } from '@coral-xyz/anchor';
import type { RootNode } from 'codama';
import { useEffect, useState } from 'react';

import { TabsList, TabsTrigger } from '@/app/shared/ui/Tabs';

import { useTabs } from '../../model/use-tabs';
import { SearchHighlightProvider } from './SearchHighlightContext';
import type { FormattedIdlViewProps } from './types';

export function BaseFormattedIdl({
    idl,
    originalIdl,
    source,
    programId,
    searchStr,
}: FormattedIdlViewProps<Idl> | FormattedIdlViewProps<RootNode>) {
    const [activeTabIndex, setActiveTabIndex] = useState<number | null>(null);
    const tabs = useTabs(idl, originalIdl, source, programId, searchStr);

    useEffect(() => {
        if (typeof activeTabIndex === 'number') return;
        setActiveTabIndex(tabs.findIndex(tab => !tab.disabled));
    }, [tabs, activeTabIndex]);

    if (!tabs || activeTabIndex === null || !idl) return null;

    // The active tab must stay active while a search disables it.
    const storedTab = tabs[activeTabIndex];
    const isStale = !storedTab || (storedTab.disabled && !searchStr?.trim());
    const activeIndex = isStale ? tabs.findIndex(tab => !tab.disabled) : activeTabIndex;
    // The view must store the fallback during render to keep it active when a search starts.
    if (activeIndex !== activeTabIndex) setActiveTabIndex(activeIndex);
    const activeTab = tabs[activeIndex];

    return (
        <SearchHighlightProvider searchStr={searchStr || ''}>
            <div>
                <TabsList className="mb-5">
                    {tabs.map((tab, index) => (
                        <TabsTrigger
                            key={tab.id}
                            active={index === activeIndex}
                            disabled={tab.disabled}
                            onClick={() => setActiveTabIndex(index)}
                        >
                            {tab.title}
                        </TabsTrigger>
                    ))}
                </TabsList>
                <div className={cn('mb-0 min-h-96', activeTab.id !== 'interact' ? 'overflow-x-auto' : '')}>
                    <ActiveTab activeTab={activeTab} />
                </div>
            </div>
        </SearchHighlightProvider>
    );
}

const ActiveTab = ({ activeTab }: { activeTab: ReturnType<typeof useTabs>[0] }) => {
    return activeTab.render();
};
