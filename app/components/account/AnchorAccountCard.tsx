import { ErrorCard } from '@components/common/ErrorCard';
import { BorshAccountsCoder, Idl } from '@coral-xyz/anchor';
import { IdlTypeDef } from '@coral-xyz/anchor/dist/cjs/idl';
import { useAnchorProgram } from '@entities/idl';
import { useProgramMetadataIdl } from '@entities/program-metadata';
import { Account } from '@providers/accounts';
import { useCluster } from '@providers/cluster';
import { getAnchorProgramName, mapAccountToRows } from '@utils/anchor';
import React, { useMemo } from 'react';

import { equals, toBuffer } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

export function AnchorAccountCard({ account }: { account: Account }) {
    const { lamports } = account;
    const { url, cluster } = useCluster();
    const { program: anchorProgram } = useAnchorProgram(account.owner.toString(), url, cluster);
    const { programMetadataIdl } = useProgramMetadataIdl(account.owner.toString(), url, cluster);
    const rawData = account.data.raw;

    // Prefer the legacy Anchor IDL; fall back to an Anchor-format IDL published via the Program
    // Metadata Program so PMP-only programs (no on-chain Anchor IDL account) decode account data too.
    const idl: Idl | undefined = useMemo(() => {
        if (anchorProgram?.idl) return anchorProgram.idl;
        const pmp = programMetadataIdl as Idl | undefined;
        return pmp && Array.isArray(pmp.accounts) ? pmp : undefined;
    }, [anchorProgram, programMetadataIdl]);

    const programName =
        getAnchorProgramName(anchorProgram) ||
        (idl?.metadata as { name?: string } | undefined)?.name ||
        'Unknown Program';

    const { decodedAccountData, accountDef } = useMemo(() => {
        let decodedAccountData: any | null = null;
        let accountDef: IdlTypeDef | undefined = undefined;
        if (idl && rawData) {
            try {
                const coder = new BorshAccountsCoder(idl);
                const account = idl.accounts?.find((accountType: any) =>
                    equals(rawData.slice(0, 8), coder.accountDiscriminator(accountType.name)),
                );
                if (account) {
                    accountDef = idl.types?.find((type: any) => type.name === account.name);
                    try {
                        decodedAccountData = coder.decode(account.name, toBuffer(rawData));
                    } catch (err) {
                        Logger.debug('[components:anchor-account] Failed to decode account data', { error: err });
                    }
                }
            } catch (err) {
                Logger.debug('[components:anchor-account] Failed to build accounts coder', { error: err });
            }
        }

        return {
            accountDef,
            decodedAccountData,
        };
    }, [idl, rawData]);

    if (lamports === undefined) return null;
    if (!idl) return <ErrorCard text="No Anchor IDL found" />;
    if (!decodedAccountData || !accountDef) {
        return <ErrorCard text="Failed to decode account data according to the public Anchor interface" />;
    }

    return (
        <div>
            <Card ui="dashkit">
                <CardHeader ui="dashkit">
                    <CardTitle as="h3" ui="dashkit">
                        {programName}: {accountDef.name.charAt(0).toUpperCase() + accountDef.name.slice(1)}
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
                        {mapAccountToRows(decodedAccountData, accountDef as IdlTypeDef, idl)}
                    </BaseTable.Body>
                </BaseTable>
            </Card>
        </div>
    );
}
