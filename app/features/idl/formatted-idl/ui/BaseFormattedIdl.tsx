'use client';

import classNames from 'classnames';
import { useEffect, useState } from 'react';

import type { FormattedIdl } from '@/app/entities/idl';

import { useTabs } from '../../model/use-tabs';

export function BaseFormattedIdl({ idl }: { idl: FormattedIdl | null }) {
    const [activeTabIndex, setActiveTabIndex] = useState<number | null>(null);
    const tabs = useTabs(idl);

    useEffect(() => {
        if (typeof activeTabIndex === 'number') return;
        setActiveTabIndex(tabs.findIndex(tab => !tab.disabled));
    }, [tabs, activeTabIndex]);

    if (!tabs || activeTabIndex === null || !idl) return null;

    const activeTab = tabs[activeTabIndex];

    return (
        <div className="idl-view">
            <div className="nav nav-tabs e-mb-5">
                {tabs.map((tab, index) => (
                    <button
                        key={tab.id}
                        className={classNames('nav-item nav-link', {
                            active: index === activeTabIndex,
                            'opacity-50': tab.disabled,
                        })}
                        disabled={tab.disabled}
                        onClick={() => setActiveTabIndex(index)}
                    >
                        {tab.title}
                    </button>
                ))}
            </div>
            <div className="table-responsive mb-0 e-min-h-[200px]">
                <ActiveTab activeTab={activeTab} />
            </div>
        </div>
    );
}

const ActiveTab = ({ activeTab }: { activeTab: ReturnType<typeof useTabs>[0] }) => {
    return activeTab.render();
};
