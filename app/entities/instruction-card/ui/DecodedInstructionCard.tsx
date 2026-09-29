import { isSignerRole, isWritableRole } from '@solana/kit';
import type { TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { toKitInstruction } from '@/app/shared/lib/web3js-compat';
import { AccountRoleBadges } from '@/app/shared/ui/AccountRoleBadges';
import { BaseTable } from '@/app/shared/ui/Table';

import { labelAccounts } from '../model/accounts';
import type { InstructionArg } from '../model/args';
import type { InstructionNode } from '../model/node';
import { ArgRows } from './ArgRows';
import { InstructionAddress } from './InstructionAddress';
import { InstructionCardView } from './InstructionCardView';
import { ProgramField } from './ProgramField';

export const DECODED_TABLE_COLUMNS = 3;

export function DecodedInstructionCard({
    node,
    ix,
    title,
    programName,
    accountNames,
    args,
    children,
}: {
    node: InstructionNode;
    ix: TransactionInstruction;
    title: string;
    programName?: string;
    accountNames: readonly string[];
    args: readonly InstructionArg[];
    /** Rows below the arguments. A row must span `DECODED_TABLE_COLUMNS`. */
    children?: React.ReactNode;
}) {
    return (
        <InstructionCardView node={node} title={title}>
            <DecodedInstructionBody ix={ix} programName={programName} accountNames={accountNames} args={args} />
            {children}
        </InstructionCardView>
    );
}

function DecodedInstructionBody({
    ix,
    programName,
    accountNames,
    args,
}: {
    ix: TransactionInstruction;
    programName?: string;
    accountNames: readonly string[];
    args: readonly InstructionArg[];
}) {
    const accounts = labelAccounts(toKitInstruction(ix).accounts, accountNames);

    return (
        <>
            <ProgramField programId={ix.programId} name={programName} colSpan={VALUE_COLUMNS} />
            {accounts.length > 0 && (
                <BaseTable.SectionRow>
                    <BaseTable.Cell>Account Name</BaseTable.Cell>
                    <BaseTable.Cell className="text-right" colSpan={VALUE_COLUMNS}>
                        Address
                    </BaseTable.Cell>
                </BaseTable.SectionRow>
            )}
            {accounts.map(({ address, role, label }, position) => (
                // Two accounts can share one address, so the row key is the position.
                <BaseTable.Row key={position} data-testid={`account-row-${position}`}>
                    <BaseTable.Cell>
                        <div className="mr-1.5 md:inline">{label}</div>
                        <AccountRoleBadges isWritable={isWritableRole(role)} isSigner={isSignerRole(role)} />
                    </BaseTable.Cell>
                    <BaseTable.Cell className="text-right" colSpan={VALUE_COLUMNS}>
                        <InstructionAddress address={address} />
                    </BaseTable.Cell>
                </BaseTable.Row>
            ))}
            {args.length > 0 && (
                <>
                    <BaseTable.SectionRow>
                        <BaseTable.Cell>Argument Name</BaseTable.Cell>
                        <BaseTable.Cell>Type</BaseTable.Cell>
                        <BaseTable.Cell className="text-right">Value</BaseTable.Cell>
                    </BaseTable.SectionRow>
                    <ArgRows args={args} />
                </>
            )}
        </>
    );
}

const VALUE_COLUMNS = DECODED_TABLE_COLUMNS - 1;
