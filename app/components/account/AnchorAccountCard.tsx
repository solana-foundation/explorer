import { ErrorCard } from '@components/common/ErrorCard';
import { BorshAccountsCoder, Idl } from '@coral-xyz/anchor';
import { IdlTypeDef } from '@coral-xyz/anchor/dist/cjs/idl';
import { getIdlSpecType, useAnchorProgram } from '@entities/idl';
import { useProgramMetadataIdl } from '@entities/program-metadata';
import { Account } from '@providers/accounts';
import { useCluster } from '@providers/cluster';
import { getAnchorProgramName } from '@utils/anchor';
import type { RootNode } from 'codama';
import React, { useMemo } from 'react';

import { equals, toBuffer } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';
import { KeyValueRows } from '@/app/shared/ui/key-value';
import { OverviewCard } from '@/app/shared/ui/OverviewCard';

import { CodamaAccountCard } from './CodamaAccountCard';
import { anchorAccountRows } from './decoded-account-rows';

export function AnchorAccountCard({ account }: { account: Account }) {
    const { lamports } = account;
    const { url, cluster } = useCluster();
    const { program: anchorProgram, idl: resolvedIdl } = useAnchorProgram(account.owner.toString(), url, cluster);
    const { programMetadataIdl } = useProgramMetadataIdl(account.owner.toString(), url, cluster);
    const rawData = account.data.raw;

    const codamaIdl: RootNode | undefined =
        resolvedIdl && getIdlSpecType(resolvedIdl) === 'codama'
            ? (resolvedIdl as RootNode)
            : programMetadataIdl && getIdlSpecType(programMetadataIdl) === 'codama'
              ? (programMetadataIdl as RootNode)
              : undefined;

    const idl: Idl | undefined = useMemo(() => {
        if (anchorProgram?.idl) return anchorProgram.idl;
        const pmp = programMetadataIdl as Idl | undefined;
        return pmp && Array.isArray(pmp.accounts) && pmp.accounts.length > 0 ? pmp : undefined;
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
    if (codamaIdl) {
        return <CodamaAccountCard account={account} idl={codamaIdl} />;
    }
    if (!idl) return <ErrorCard text="No Anchor IDL found" />;
    if (!decodedAccountData || !accountDef) {
        return <ErrorCard text="Failed to decode account data according to the public Anchor interface" />;
    }

    return (
        <OverviewCard title={`${programName}: ${accountDef.name.charAt(0).toUpperCase() + accountDef.name.slice(1)}`}>
            <KeyValueRows rows={anchorAccountRows(decodedAccountData)} />
        </OverviewCard>
    );
}
