'use client';

import type { Idl } from '@coral-xyz/anchor';
import { cn } from '@shared/utils';
import type { RootNode } from 'codama';
import { useEffect, useState } from 'react';

import { TabsList, TabsTrigger } from '@/app/shared/ui/Tabs';

import { useTabs } from '../../model/use-tabs';
import { SearchHighlightProvider } from './SearchHighlightContext';
import type { FormattedIdlViewProps } from './types';

export function BaseFormattedIdl({
    idl,
    originalIdl,
    programId,
    searchStr,
}: FormattedIdlViewProps<Idl> | FormattedIdlViewProps<RootNode>) {
    const [activeTabIndex, setActiveTabIndex] = useState<number | null>(null);
    const tabs = useTabs(idl, originalIdl, programId, searchStr);

    useEffect(() => {
        if (typeof activeTabIndex === 'number') return;
        setActiveTabIndex(tabs.findIndex(tab => !tab.disabled));
    }, [tabs, activeTabIndex]);

    if (!tabs || activeTabIndex === null || !idl) return null;

    const activeTab = tabs[activeTabIndex];

    return (
        <SearchHighlightProvider searchStr={searchStr || ''}>
            <div>
                <TabsList className="e-mb-5">
                    {tabs.map((tab, index) => (
                        <TabsTrigger
                            key={tab.id}
                            active={index === activeTabIndex}
                            disabled={tab.disabled}
                            onClick={() => setActiveTabIndex(index)}
                        >
                            {tab.title}
                        </TabsTrigger>
                    ))}
                </TabsList>
                <div className={cn('e-mb-0 e-min-h-96', activeTab.id !== 'interact' ? 'table-responsive' : '')}>
                    <ActiveTab activeTab={activeTab} />
                </div>
            </div>
        </SearchHighlightProvider>
    );
}

const ActiveTab = ({ activeTab }: { activeTab: ReturnType<typeof useTabs>[0] }) => {
    return activeTab.render();
};
