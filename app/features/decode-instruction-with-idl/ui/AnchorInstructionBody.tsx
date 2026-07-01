import { Idl, Instruction } from '@coral-xyz/anchor';
import { IdlInstruction } from '@coral-xyz/anchor/dist/cjs/idl';
import { TransactionInstruction } from '@solana/web3.js';
import { FlattenedIdlAccount, mapIxArgsToRows } from '@utils/anchor';
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, CornerDownRight } from 'react-feather';

import { Address } from '@/app/components/common/Address';
import { Badge } from '@/app/components/shared/ui/badge';
import { BaseTable } from '@/app/shared/ui/Table';

import { type AnchorRow, buildAnchorRows, visibleAnchorRows } from '../lib/build-anchor-rows';

/**
 * Rich table body for an Anchor-decoded instruction: a Program row, an account table with collapsible
 * nested account groups, and the decoded argument rows. Fed the pre-decoded data from
 * `decodeAnchorInstruction`; the Anchor counterpart to the flat `CodamaInstructionBody`.
 */
export function AnchorInstructionBody({
    ix,
    idl,
    programName,
    ixAccounts,
    decodedIxData,
    ixDef,
}: {
    ix: TransactionInstruction;
    idl: Idl;
    programName: string;
    ixAccounts: FlattenedIdlAccount[] | undefined;
    decodedIxData: Instruction | undefined;
    ixDef: IdlInstruction | undefined;
}) {
    // Which groups the user has expanded; empty = all collapsed (the default). Keyed by stable group id
    // rather than array position, and never seeded from props, so it survives a re-decode.
    const [expandedGroups, setExpandedGroups] = useState<ReadonlySet<string>>(() => new Set<string>());

    // Flatten the IDL accounts + on-chain keys into a render plan once; collapse is applied on top.
    const rows = useMemo(() => (ixAccounts ? buildAnchorRows(ix.keys, ixAccounts) : []), [ix.keys, ixAccounts]);

    if (!ixAccounts || !decodedIxData || !ixDef) {
        return (
            <BaseTable.Row>
                <BaseTable.Cell colSpan={3} className="lg:text-center">
                    Failed to decode account data according to the public Anchor interface
                </BaseTable.Cell>
            </BaseTable.Row>
        );
    }

    const toggleGroup = (id: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    return (
        <>
            <BaseTable.Row>
                <BaseTable.Cell>Program</BaseTable.Cell>
                <BaseTable.Cell className="text-right" colSpan={2}>
                    <Address pubkey={ix.programId} alignRight link raw overrideText={programName} />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row className="bg-dark-background text-dk-xs font-semibold uppercase tracking-[0.08em] text-dark-muted-foreground">
                <BaseTable.Cell>Account Name</BaseTable.Cell>
                <BaseTable.Cell className="text-right" colSpan={2}>
                    Address
                </BaseTable.Cell>
            </BaseTable.Row>
            {visibleAnchorRows(rows, expandedGroups).map(row =>
                row.kind === 'group' ? (
                    <GroupHeaderRow
                        key={`group-${row.id}`}
                        row={row}
                        expanded={expandedGroups.has(row.id)}
                        onToggle={() => toggleGroup(row.id)}
                    />
                ) : (
                    <AccountRow key={row.keyIndex} row={row} />
                ),
            )}

            {ixDef.args.length > 0 && (
                <>
                    <BaseTable.Row className="bg-dark-background text-dk-xs font-semibold uppercase tracking-[0.08em] text-dark-muted-foreground">
                        <BaseTable.Cell>Argument Name</BaseTable.Cell>
                        <BaseTable.Cell>Type</BaseTable.Cell>
                        <BaseTable.Cell className="text-right">Value</BaseTable.Cell>
                    </BaseTable.Row>
                    {mapIxArgsToRows(decodedIxData.data, ixDef, idl)}
                </>
            )}
        </>
    );
}

function GroupHeaderRow({
    row,
    expanded,
    onToggle,
}: {
    row: Extract<AnchorRow, { kind: 'group' }>;
    expanded: boolean;
    onToggle: () => void;
}) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell colSpan={2}>{row.name}</BaseTable.Cell>
            <BaseTable.Cell className="text-right" onClick={onToggle}>
                <div className="cursor-pointer">
                    {expanded ? (
                        <>
                            <span className="mr-1.5 text-dk-info">Collapse</span>
                            <ChevronUp size={15} />
                        </>
                    ) : (
                        <>
                            <span className="mr-1.5 text-dk-info">Expand</span>
                            <ChevronDown size={15} />
                        </>
                    )}
                </div>
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}

function AccountRow({ row }: { row: Extract<AnchorRow, { kind: 'account' }> }) {
    return (
        <BaseTable.Row className={row.isNested ? 'bg-black/20' : ''}>
            <BaseTable.Cell>
                <div className="flex flex-row items-center">
                    {row.isNested && <CornerDownRight className="mb-[3px] mr-1.5" size={14} />}
                    <div className="mr-1.5 md:inline">{row.name}</div>
                    {row.isWritable && (
                        <Badge ui="dashkit" variant="destructive" className="mr-[3px]">
                            Writable
                        </Badge>
                    )}
                    {row.isSigner && (
                        <Badge ui="dashkit" variant="info" className="mr-[3px]">
                            Signer
                        </Badge>
                    )}
                </div>
            </BaseTable.Cell>
            <BaseTable.Cell className="text-right" colSpan={2}>
                <Address pubkey={row.pubkey} alignRight link />
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}
