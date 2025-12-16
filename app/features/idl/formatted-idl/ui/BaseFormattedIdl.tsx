'use client';

import type { Idl } from '@coral-xyz/anchor';
import { cn } from '@shared/utils';
import type { RootNode } from 'codama';
import { useEffect, useState } from 'react';

import { useTabs } from '../../model/use-tabs';
import { SearchHighlightProvider } from './SearchHighlightContext';
import type { FormattedIdlViewProps } from './types';

export function BaseFormattedIdl({
    idl,
    originalIdl,
    searchStr,
}: FormattedIdlViewProps<Idl> | FormattedIdlViewProps<RootNode>) {
    const [activeTabIndex, setActiveTabIndex] = useState<number | null>(null);
    const tabs = useTabs(idl, originalIdl, searchStr);

    useEffect(() => {
        if (typeof activeTabIndex === 'number') return;
        setActiveTabIndex(tabs.findIndex(tab => !tab.disabled));
    }, [tabs, activeTabIndex]);

    if (!tabs || activeTabIndex === null || !idl) return null;

    const activeTab = tabs[activeTabIndex];

    return (
        <SearchHighlightProvider searchStr={searchStr || ''}>
            <div className="idl-view">
                <div className="nav nav-tabs e-mb-5">
                    {tabs.map((tab, index) => (
                        <button
                            key={tab.id}
                            className={cn('nav-item nav-link', {
                                active: index === activeTabIndex,
                                'e-opacity-50': tab.disabled,
                            })}
                            disabled={tab.disabled}
                            onClick={() => setActiveTabIndex(index)}
                        >
                            {tab.title}
                        </button>
                    ))}
                </div>
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
