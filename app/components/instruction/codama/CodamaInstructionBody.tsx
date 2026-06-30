import { type AccountMeta, isSignerRole, isWritableRole } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import React from 'react';

import { Badge } from '@/app/components/shared/ui/badge';
import { BaseTable } from '@/app/shared/ui/Table';
import { camelToTitleCase } from '@/app/utils';

import { Address } from '../../common/Address';
import { mapCodamaIxArgsToRows } from './codamaUtils';

type AccountLike = Pick<AccountMeta<string>, 'address' | 'role'>;

/**
 * Shared table body for Codama-shaped instructions: a Program row, an account
 * table (named accounts labelled from `namedAccounts`, extras shown as
 * "Remaining Account #N"), and the decoded argument rows. Used by the
 * Lighthouse card; extracted from its former inline `CodamaCard`.
 */
export function CodamaInstructionBody({
    programId,
    programName,
    accounts,
    namedAccounts,
    data,
}: {
    programId: PublicKey;
    programName: string;
    accounts: readonly AccountLike[];
    namedAccounts?: Record<string, AccountMeta<string>>;
    data?: Record<string, unknown>;
}) {
    // Codama emits `namedAccounts` in instruction-account order, so the Nth
    // entry names the Nth row. Index by position rather than reversing to a
    // name-by-address map: two accounts can share the same address (e.g.
    // MemoryWrite's payer and sourceAccount), which would collapse in a map and
    // mislabel one of the rows.
    const namedAccountNames = namedAccounts ? Object.keys(namedAccounts) : [];

    return (
        <>
            <BaseTable.Row>
                <BaseTable.Cell>Program</BaseTable.Cell>
                <BaseTable.Cell className="text-right" colSpan={2}>
                    <Address pubkey={programId} alignRight link raw overrideText={programName} />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row className="bg-dark-background text-dk-xs font-semibold uppercase tracking-[0.08em] text-dark-muted-foreground">
                <BaseTable.Cell>Account Name</BaseTable.Cell>
                <BaseTable.Cell className="text-right" colSpan={2}>
                    Address
                </BaseTable.Cell>
            </BaseTable.Row>
            {accounts.map(({ address, role }, keyIndex) => {
                return (
                    <BaseTable.Row key={keyIndex} data-testid={`account-row-${keyIndex}`}>
                        <BaseTable.Cell>
                            <div className="mr-1.5 md:inline">
                                {namedAccounts
                                    ? keyIndex < namedAccountNames.length
                                        ? camelToTitleCase(namedAccountNames[keyIndex])
                                        : `Remaining Account #${keyIndex + 1 - namedAccountNames.length}`
                                    : `Account #${keyIndex + 1}`}
                            </div>
                            {isWritableRole(role) && (
                                <Badge ui="dashkit" variant="destructive" className="mr-[3px]">
                                    Writable
                                </Badge>
                            )}
                            {isSignerRole(role) && (
                                <Badge ui="dashkit" variant="info" className="mr-[3px]">
                                    Signer
                                </Badge>
                            )}
                        </BaseTable.Cell>
                        <BaseTable.Cell className="text-right" colSpan={2}>
                            <Address pubkey={new PublicKey(address)} alignRight link />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                );
            })}

            {data && (
                <>
                    <BaseTable.Row className="bg-dark-background text-dk-xs font-semibold uppercase tracking-[0.08em] text-dark-muted-foreground">
                        <BaseTable.Cell>Argument Name</BaseTable.Cell>
                        <BaseTable.Cell>Type</BaseTable.Cell>
                        <BaseTable.Cell className="text-right">Value</BaseTable.Cell>
                    </BaseTable.Row>
                    {mapCodamaIxArgsToRows(data)}
                </>
            )}
        </>
    );
}
