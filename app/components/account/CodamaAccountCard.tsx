import { ErrorCard } from '@components/common/ErrorCard';
import { ArgRows, parseCodamaArgs } from '@entities/instruction-card';
import { IdlStandard } from '@explorer/idl-decode';
import { decodeAccountWithIdl } from '@explorer/idl-decode/codama';
import { Account } from '@providers/accounts';
import { capitalizeFirstLetter } from '@utils/index';
import type { RootNode } from 'codama';
import React, { useMemo } from 'react';

import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

// Decodes and renders a program account against a Codama IDL — the path legacy (pre-0.30) Anchor IDLs
// take after `normalizeAnchorIdl` converts them to Codama root nodes. Shares the instruction card's
// `ArgRows` so account fields render the same way decoded instruction arguments do.
export function CodamaAccountCard({ account, idl }: { account: Account; idl: RootNode }) {
    const { lamports } = account;
    const rawData = account.data.raw;

    const decoded = useMemo(() => {
        if (!rawData) return undefined;
        // idl-decode pins a slightly different `codama` node type than the app; the runtime root node is
        // identical, so cross the type boundary once here.
        const decode = decodeAccountWithIdl(idl as unknown as Parameters<typeof decodeAccountWithIdl>[0], rawData);
        if (decode.kind !== IdlStandard.Codama) return undefined;

        const path = decode.decoded.path as ReadonlyArray<{
            kind?: string;
            name?: string;
            program?: { name?: string };
        }>;
        const programName = path[0]?.program?.name;
        const accountName = [...path].reverse().find(node => node?.kind === 'accountNode')?.name;

        return { accountName, args: parseCodamaArgs(decode.decoded.data), programName };
    }, [idl, rawData]);

    // eslint-disable-next-line unicorn/no-null -- a React component returns null to render nothing
    if (lamports === undefined) return null;
    if (!decoded || decoded.args.length === 0) {
        return <ErrorCard text="Failed to decode account data according to the public Anchor interface" />;
    }

    const title = [decoded.programName, decoded.accountName]
        .filter((part): part is string => Boolean(part))
        .map(capitalizeFirstLetter)
        .join(': ');

    return (
        <div>
            <Card ui="dashkit">
                <CardHeader ui="dashkit">
                    <CardTitle as="h3" ui="dashkit">
                        {title || 'Account'}
                    </CardTitle>
                </CardHeader>
                <BaseTable ui="dashkit" variant="card" nowrap>
                    <BaseTable.Head>
                        <BaseTable.Row>
                            <BaseTable.HeaderCell className="w-px">Field</BaseTable.HeaderCell>
                            <BaseTable.HeaderCell className="w-px">Type</BaseTable.HeaderCell>
                            <BaseTable.HeaderCell className="w-px">Value</BaseTable.HeaderCell>
                        </BaseTable.Row>
                    </BaseTable.Head>
                    <BaseTable.Body>
                        <ArgRows args={decoded.args} />
                    </BaseTable.Body>
                </BaseTable>
            </Card>
        </div>
    );
}
