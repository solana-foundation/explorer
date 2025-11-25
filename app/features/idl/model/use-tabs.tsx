'use client';

import type { FormattedIdl } from '@entities/idl';
import React, { useMemo } from 'react';

import { BaseIdlAccounts } from '../formatted-idl/ui/BaseIdlAccounts';
import { BaseIdlConstants } from '../formatted-idl/ui/BaseIdlConstants';
import { BaseIdlErrors } from '../formatted-idl/ui/BaseIdlErrors';
import { BaseIdlEvents } from '../formatted-idl/ui/BaseIdlEvents';
import { BaseIdlInstructions } from '../formatted-idl/ui/BaseIdlInstructions';
import { BaseIdlPdas } from '../formatted-idl/ui/BaseIdlPdas';
import { BaseIdlTypes } from '../formatted-idl/ui/BaseIdlTypes';
import type { FormattedIdlDataView, IdlDataKeys } from '../formatted-idl/ui/types';

type TabId = 'instructions' | 'accounts' | 'types' | 'errors' | 'constants' | 'events' | 'pdas';

export type DataTab<K extends IdlDataKeys = IdlDataKeys> = {
    id: TabId;
    title: React.ReactNode;
    disabled: boolean;
    render: () => React.ReactElement<FormattedIdlDataView<K>>;
};

type Tab = DataTab;

export function useTabs(idl: FormattedIdl | null, searchStr?: string) {
    const tabs: Tab[] = useMemo(() => {
        if (!idl) return [];

        const hasSearch = Boolean(searchStr?.trim());

        const createTabRenderer = <K extends IdlDataKeys>(
            Component: React.ComponentType<FormattedIdlDataView<K>>,
            data: unknown[] | undefined,
            tabName: string
        ) => {
            const TabRenderer = () => {
                if (hasSearch && (!data || data.length === 0)) {
                    return <NoSearchResultsPlaceholder tabName={tabName} />;
                }
                return <Component data={data as any} />;
            };
            TabRenderer.displayName = `TabRenderer(${tabName})`;
            return TabRenderer;
        };

        const tabItems: Tab[] = [
            {
                disabled: !idl.instructions,
                id: 'instructions',
                render: createTabRenderer(BaseIdlInstructions, idl.instructions, 'instructions'),
                title: <TabTitle baseTitle="Instructions" data={idl.instructions} searchStr={searchStr} />,
            },
            {
                disabled: !idl.accounts?.length,
                id: 'accounts',
                render: createTabRenderer(BaseIdlAccounts, idl.accounts, 'accounts'),
                title: <TabTitle baseTitle="Accounts" data={idl.accounts} searchStr={searchStr} />,
            },
            {
                disabled: !idl.types?.length,
                id: 'types',
                render: createTabRenderer(BaseIdlTypes, idl.types, 'types'),
                title: <TabTitle baseTitle="Types" data={idl.types} searchStr={searchStr} />,
            },
            {
                disabled: !idl.pdas?.length,
                id: 'pdas',
                render: createTabRenderer(BaseIdlPdas, idl.pdas, 'pdas'),
                title: <TabTitle baseTitle="PDAs" data={idl.pdas} searchStr={searchStr} />,
            },
            {
                disabled: !idl.errors?.length,
                id: 'errors',
                render: createTabRenderer(BaseIdlErrors, idl.errors, 'errors'),
                title: <TabTitle baseTitle="Errors" data={idl.errors} searchStr={searchStr} />,
            },
            {
                disabled: !idl.constants?.length,
                id: 'constants',
                render: createTabRenderer(BaseIdlConstants, idl.constants, 'constants'),
                title: <TabTitle baseTitle="Constants" data={idl.constants} searchStr={searchStr} />,
            },
            {
                disabled: !idl.events?.length,
                id: 'events',
                render: createTabRenderer(BaseIdlEvents, idl.events, 'events'),
                title: <TabTitle baseTitle="Events" data={idl.events} searchStr={searchStr} />,
            },
        ];

        return tabItems;
    }, [idl, searchStr]);

    return tabs;
}

type TabTitleProps = {
    baseTitle: string;
    data: unknown[] | undefined;
    searchStr?: string;
};

function TabTitle({ baseTitle, data, searchStr }: TabTitleProps) {
    const hasSearch = Boolean(searchStr?.trim());
    const count = data?.length;
    if (hasSearch && count !== undefined) {
        return (
            <>
                {baseTitle} <span className="e-font-mono e-text-xs">{`(${count})`}</span>
            </>
        );
    }
    return <>{baseTitle}</>;
}

function NoSearchResultsPlaceholder({ tabName }: { tabName: string }) {
    return (
        <div className="e-flex e-items-center e-justify-center e-py-6 e-text-center">
            <p className="e-m-0 e-text-sm e-text-neutral-500">No {tabName.toLowerCase()} found</p>
        </div>
    );
}
