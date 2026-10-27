import { ExpandToggleCell } from '@shared/ui/expandable-row';
import { isSignerRole, isWritableRole } from '@solana/kit';
import type { TransactionInstruction } from '@solana/web3.js';
import React from 'react';
import { CornerDownRight } from 'react-feather';

import { toKitInstruction } from '@/app/shared/lib/web3js-compat';
import { AccountRoleBadges } from '@/app/shared/ui/AccountRoleBadges';
import { BaseTable } from '@/app/shared/ui/Table';

import { type AccountName, type AccountRow, labelAccounts, visibleAccountRows } from '../model/accounts';
import type { InstructionArg } from '../model/args';
import type { RawInstructionNode } from '../model/node';
import { ArgRows, nestedRowVariants } from './ArgRows';
import { InstructionAddress } from './InstructionAddress';
import { InstructionCardView } from './InstructionCardView';
import { ProgramField } from './ProgramField';

export const DECODED_TABLE_COLUMNS = 3;

export function DecodedInstructionCard({
    node,
    title,
    programName,
    accountNames,
    args,
    events,
    children,
}: {
    node: RawInstructionNode;
    title: string;
    programName?: string;
    accountNames: readonly AccountName[];
    args: readonly InstructionArg[];
    events?: React.ReactNode[];
    /** Rows below the arguments. A row must span `DECODED_TABLE_COLUMNS`. */
    children?: React.ReactNode;
}) {
    return (
        <InstructionCardView node={node} title={title} events={events}>
            <DecodedInstructionBody ix={node.raw} programName={programName} accountNames={accountNames} args={args} />
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
    accountNames: readonly AccountName[];
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
            <AccountRows rows={accounts} />
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

function AccountRows({ rows }: { rows: readonly AccountRow[] }) {
    // Groups start collapsed. The set holds group ids, so it survives a new decode.
    const [expanded, setExpanded] = React.useState<ReadonlySet<string>>(() => new Set());

    return (
        <>
            {visibleAccountRows(rows, expanded).map(row =>
                row.kind === 'group' ? (
                    <BaseTable.Row key={row.id}>
                        <BaseTable.Cell colSpan={VALUE_COLUMNS}>{row.label}</BaseTable.Cell>
                        <ExpandToggleCell
                            expanded={expanded.has(row.id)}
                            onToggle={() => setExpanded(current => toggle(current, row.id))}
                        />
                    </BaseTable.Row>
                ) : (
                    // Two accounts can share one address, so the row key is the position.
                    <BaseTable.Row
                        key={row.position}
                        data-testid={`account-row-${row.position}`}
                        className={nestedRowVariants({ nested: row.depth > 0 })}
                    >
                        <BaseTable.Cell>
                            <div className="mr-1.5 md:inline">
                                {row.depth > 0 && <CornerDownRight className="mb-[3px] mr-1.5 inline" size={14} />}
                                {row.label}
                            </div>
                            <AccountRoleBadges
                                isWritable={isWritableRole(row.role)}
                                isSigner={isSignerRole(row.role)}
                            />
                        </BaseTable.Cell>
                        <BaseTable.Cell className="text-right" colSpan={VALUE_COLUMNS}>
                            <InstructionAddress address={row.address} />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                ),
            )}
        </>
    );
}

function toggle(ids: ReadonlySet<string>, id: string): ReadonlySet<string> {
    const next = new Set(ids);
    if (!next.delete(id)) {
        next.add(id);
    }
    return next;
}

const VALUE_COLUMNS = DECODED_TABLE_COLUMNS - 1;
