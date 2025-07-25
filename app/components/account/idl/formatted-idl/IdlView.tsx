'use client';

import { Idl } from '@coral-xyz/anchor';
import classNames from 'classnames';
import { RootNode } from 'codama';
import { useEffect, useMemo, useState } from 'react';

import { formatIdl } from '@/app/utils/convertLegacyIdl';

import { useFormatAnchorIdl } from './formatters/anchor';
import { useFormatCodamaIdl } from './formatters/codama';
import { FormattedIdl } from './formatters/FormattedIdl';
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
    const [activeTab, setActiveTab] = useState<Tab>();
    const tabs = useTabs(idl);

    useEffect(() => {
        if (activeTab) return;
        setActiveTab(tabs.find(tab => !tab.disabled));
    }, [tabs, activeTab]);

    if (!tabs) return null;

    return (
        <div className="idl-view">
            <div className="nav nav-tabs mb-5">
                {tabs.map(tab => (
                    <button
                        key={tab.title}
                        className={classNames('nav-item nav-link', {
                            active: tab.id === activeTab?.id,
                            'opacity-50': tab.disabled,
                        })}
                        disabled={tab.disabled}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.title}
                    </button>
                ))}
            </div>
            <div className="table-responsive mb-0 e-min-h-[200px]">{!!activeTab && activeTab.component}</div>
        </div>
    );
}

export function AnchorFormattedIdl({ idl, programId }: { idl?: Idl; programId: string }) {
    const formattedIdl = useFormatAnchorIdl(idl ? formatIdl(idl, programId) : idl);
    return <FormattedIdlView idl={formattedIdl} />;
}

export function CodamaFormattedIdl({ idl }: { idl?: RootNode }) {
    const formattedIdl = useFormatCodamaIdl(idl);
    return <FormattedIdlView idl={formattedIdl} />;
}
