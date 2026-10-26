import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { BorshAccountsCoder, Idl } from '@coral-xyz/anchor';
import { IdlTypeDef } from '@coral-xyz/anchor/dist/cjs/idl';
import {
    getAnchorIdls,
    getAnchorIdlsWithAccounts,
    getCodamaIdlsWithAccounts,
    useAnchorProgram,
    useProgramIdls,
} from '@entities/idl';
import { Account } from '@providers/accounts';
import { useCluster } from '@providers/cluster';
import { getAnchorProgramName } from '@utils/anchor';
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
    const { idls } = useProgramIdls(account.owner.toString(), url, cluster);
    const { program: anchorProgram } = useAnchorProgram({
        cluster,
        programAddress: account.owner.toString(),
        select: getAnchorIdlsWithAccounts,
        url,
    });
    const rawData = account.data.raw;
    const idl: Idl | undefined = anchorProgram?.idl;
    const programName = getAnchorProgramName(anchorProgram) || 'Unknown Program';

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

        return { accountDef, decodedAccountData };
    }, [idl, rawData]);

    if (lamports === undefined) return null;
    if (!idls) return <LoadingCard message="Loading program IDL" />;

    // A buildable Anchor program that decodes this account wins.
    if (idl && decodedAccountData && accountDef) {
        return (
            <OverviewCard
                title={`${programName}: ${accountDef.name.charAt(0).toUpperCase() + accountDef.name.slice(1)}`}
            >
                <KeyValueRows rows={anchorAccountRows(decodedAccountData)} />
            </OverviewCard>
        );
    }

    // Otherwise a Codama IDL (incl. legacy Anchor IDLs that `normalizeAnchorIdl` converted) with account
    // types decodes through the Codama pipeline, not an Anchor Program.
    const codamaIdl = getCodamaIdlsWithAccounts(idls)[0];
    if (codamaIdl) return <CodamaAccountCard account={account} idl={codamaIdl} />;

    if (getAnchorIdls(idls).length === 0) return <ErrorCard text="No Anchor IDL found" />;
    return <ErrorCard text="Failed to decode account data according to the public Anchor interface" />;
}
