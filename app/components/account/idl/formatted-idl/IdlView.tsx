'use client';

import { Idl } from '@coral-xyz/anchor';
import classNames from 'classnames';
import { RootNode } from 'codama';
import { useEffect, useMemo, useState } from 'react';

import { formatDisplayIdl, getFormattedIdl } from '@/app/utils/convertLegacyIdl';

import { useFormatAnchorIdl } from './formatters/anchor';
import { useFormatCodamaIdl } from './formatters/codama';
import { FormattedIdl } from './formatters/FormattedIdl';
import { useSearchIdl } from './formatters/search';
import { IdlAccountsView } from './IdlAccounts';
import { IdlConstantsView } from './IdlConstants';
import { IdlErrorsView } from './IdlErrors';
import { IdlEventsView } from './IdlEvents';
import { IdlInstructionsView } from './IdlInstructions';
import { IdlPdasView } from './IdlPdas';
import { IdlTypesView } from './IdlTypes';

type TabId = 'instructions' | 'accounts' | 'types' | 'errors' | 'constants' | 'events' | 'pdas';

type Tab = {
    id: TabId;
    title: string;
    disabled: boolean;
    component: JSX.Element;
};

function useTabs(idl: FormattedIdl | null) {
    const tabs: Tab[] = useMemo(() => {
        if (!idl) return [];

        return [
            {
                component: <IdlInstructionsView data={idl.instructions} />,
                disabled: !idl.instructions,
                id: 'instructions',
                title: 'Instructions',
            },
            {
                component: <IdlAccountsView data={idl.accounts} />,
                disabled: !idl.accounts?.length,
                id: 'accounts',
                title: 'Accounts',
            },
            {
                component: <IdlTypesView data={idl.types} />,
                disabled: !idl.types?.length,
                id: 'types',
                title: 'Types',
            },
            {
                component: <IdlPdasView data={idl.pdas} />,
                disabled: !idl.pdas?.length,
                id: 'pdas',
                title: 'Pdas',
            },
            {
                component: <IdlErrorsView data={idl.errors} />,
                disabled: !idl.errors?.length,
                id: 'errors',
                title: 'Errors',
            },
            {
                component: <IdlConstantsView data={idl.constants} />,
                disabled: !idl.constants?.length,
                id: 'constants',
                title: 'Constants',
            },
            {
                component: <IdlEventsView data={idl.events} />,
                disabled: !idl.events?.length,
                id: 'events',
                title: 'Events',
            },
        ];
    }, [idl]);

    return tabs;
}

export function FormattedIdlView({ idl }: { idl: FormattedIdl | null }) {
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
            <div className="nav nav-tabs mb-5">
                {tabs.map((tab, index) => (
                    <button
                        key={tab.title}
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
            <div className="table-responsive mb-0 e-min-h-[200px]">{activeTab.component}</div>
        </div>
    );
}

export function AnchorFormattedIdl({
    idl,
    programId,
    searchStr = '',
}: {
    idl?: Idl;
    programId: string;
    searchStr?: string;
}) {
    const formattedIdl = getFormattedIdl(formatDisplayIdl, idl, programId);
    const anchorFormattedIdl = useFormatAnchorIdl(idl ? formattedIdl : idl);
    const searchResults = useSearchIdl(anchorFormattedIdl, searchStr);
    return <FormattedIdlView idl={searchResults} />;
}

export function CodamaFormattedIdl({ idl, searchStr = '' }: { idl?: RootNode; searchStr?: string }) {
    const formattedIdl = useFormatCodamaIdl(idl);
    const searchResults = useSearchIdl(formattedIdl, searchStr);
    return <FormattedIdlView idl={searchResults} />;
}
