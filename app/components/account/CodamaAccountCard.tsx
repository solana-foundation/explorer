import { ErrorCard } from '@components/common/ErrorCard';
import { IdlStandard } from '@explorer/idl-decode';
import { decodeAccountWithIdl } from '@explorer/idl-decode/codama';
import { Account } from '@providers/accounts';
import { capitalizeFirstLetter } from '@utils/index';
import type { RootNode } from 'codama';
import React, { useEffect, useMemo } from 'react';

import { Logger } from '@/app/shared/lib/logger';
import { KeyValueRows } from '@/app/shared/ui/key-value';
import { OverviewCard } from '@/app/shared/ui/OverviewCard';

import { codamaAccountRows } from './decoded-account-rows';

export function CodamaAccountCard({ account, idl }: { account: Account; idl: RootNode }) {
    const { lamports } = account;
    const rawData = account.data.raw;

    const decoded = useMemo(() => {
        if (!rawData) return undefined;
        const decode = decodeAccountWithIdl(idl as unknown as Parameters<typeof decodeAccountWithIdl>[0], rawData);
        // A non-Codama arm means no account type matched; the unknown arm only carries errors when
        // decoding genuinely threw, as opposed to a plain discriminator miss.
        if (decode.kind !== IdlStandard.Codama) {
            return { errors: decode.kind === 'unknown' ? decode.errors : [], kind: 'failed' as const };
        }

        const path = decode.decoded.path as ReadonlyArray<{
            kind?: string;
            name?: string;
            program?: { name?: string };
        }>;
        const programName = path[0]?.program?.name;
        const accountName = [...path].reverse().find(node => node?.kind === 'accountNode')?.name;

        return { accountName, kind: 'ok' as const, programName, rows: codamaAccountRows(decode.decoded.data) };
    }, [idl, rawData]);

    useEffect(() => {
        if (decoded?.kind === 'failed' && decoded.errors.length > 0) {
            Logger.error(new Error('[account:codama] Failed to decode account data', { cause: decoded.errors[0] }), {
                programAddress: account.owner.toString(),
                sentry: true,
            });
        }
    }, [decoded, account.owner]);

    // eslint-disable-next-line unicorn/no-null -- a React component returns null to render nothing
    if (lamports === undefined) return null;
    if (!decoded || decoded.kind === 'failed') {
        return <ErrorCard text="Failed to decode account data according to the program interface" />;
    }
    if (decoded.rows.length === 0) {
        return <ErrorCard text="No account data to display for the program interface" />;
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
