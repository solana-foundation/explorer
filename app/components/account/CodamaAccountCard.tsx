import { ErrorCard } from '@components/common/ErrorCard';
import { IdlStandard } from '@explorer/idl-decode';
import { decodeAccountWithIdl } from '@explorer/idl-decode/codama';
import { Account } from '@providers/accounts';
import { capitalizeFirstLetter } from '@utils/index';
import type { RootNode } from 'codama';
import React, { useMemo } from 'react';

import { KeyValueRows } from '@/app/shared/ui/key-value';
import { OverviewCard } from '@/app/shared/ui/OverviewCard';

import { codamaAccountRows } from './decoded-account-rows';

export function CodamaAccountCard({ account, idl }: { account: Account; idl: RootNode }) {
    const { lamports } = account;
    const rawData = account.data.raw;

    const decoded = useMemo(() => {
        if (!rawData) return undefined;
        const decode = decodeAccountWithIdl(idl as unknown as Parameters<typeof decodeAccountWithIdl>[0], rawData);
        if (decode.kind !== IdlStandard.Codama) return undefined;

        const path = decode.decoded.path as ReadonlyArray<{
            kind?: string;
            name?: string;
            program?: { name?: string };
        }>;
        const programName = path[0]?.program?.name;
        const accountName = [...path].reverse().find(node => node?.kind === 'accountNode')?.name;

        return { accountName, programName, rows: codamaAccountRows(decode.decoded.data) };
    }, [idl, rawData]);

    // eslint-disable-next-line unicorn/no-null -- a React component returns null to render nothing
    if (lamports === undefined) return null;
    if (!decoded || decoded.rows.length === 0) {
        return <ErrorCard text="Failed to decode account data according to the public Anchor interface" />;
    }

    const title = [decoded.programName, decoded.accountName]
        .filter((part): part is string => Boolean(part))
        .map(capitalizeFirstLetter)
        .join(': ');

    return (
        <OverviewCard title={title || 'Account'}>
            <KeyValueRows rows={decoded.rows} />
        </OverviewCard>
    );
}
