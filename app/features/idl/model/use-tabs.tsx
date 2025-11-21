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
    title: string;
    disabled: boolean;
    render: () => React.ReactElement<FormattedIdlDataView<K>>;
};

type Tab = DataTab;

export function useTabs(idl: FormattedIdl | null) {
    const tabs: Tab[] = useMemo(() => {
        if (!idl) return [];

        const tabItems: Tab[] = [
            {
                disabled: !idl.instructions,
                id: 'instructions',
                render: () => <BaseIdlInstructions data={idl.instructions} />,
                title: 'Instructions',
            },
            {
                disabled: !idl.accounts?.length,
                id: 'accounts',
                render: () => <BaseIdlAccounts data={idl.accounts} />,
                title: 'Accounts',
            },
            {
                disabled: !idl.types?.length,
                id: 'types',
                render: () => <BaseIdlTypes data={idl.types} />,
                title: 'Types',
            },
            {
                disabled: !idl.pdas?.length,
                id: 'pdas',
                render: () => <BaseIdlPdas data={idl.pdas} />,
                title: 'PDAs',
            },
            {
                disabled: !idl.errors?.length,
                id: 'errors',
                render: () => <BaseIdlErrors data={idl.errors} />,
                title: 'Errors',
            },
            {
                disabled: !idl.constants?.length,
                id: 'constants',
                render: () => <BaseIdlConstants data={idl.constants} />,
                title: 'Constants',
            },
            {
                disabled: !idl.events?.length,
                id: 'events',
                render: () => <BaseIdlEvents data={idl.events} />,
                title: 'Events',
            },
        ];

        return tabItems;
    }, [idl]);

    return tabs;
}
